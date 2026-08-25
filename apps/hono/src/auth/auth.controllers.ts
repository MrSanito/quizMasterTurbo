import crypto from "node:crypto";
import { prisma } from "@repo/db";
import redis from "@repo/redis";
import {
	LoginSchema,
	RegisterSchema,
	ValidateLoginSchema,
	ValidateRegisterSchema,
} from "@repo/types";
import bcrypt from "bcrypt";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import {
	getForgotPasswordHtml,
	getOtpHtml,
	getVerifyEmailHtml,
} from "../configs/email";
import { sendResendEmail } from "../configs/resend";
import { logger } from "../utils/logger.js";
import {
	computeJwkThumbprint,
	familyKey,
	generateAccessToken,
	generateRefreshToken,
	otpKey,
	rtKey,
	userCacheKey,
	verifyDpopProof,
	verifyRefreshToken,
} from "./auth.services";

const _BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);
const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

function clearAuthCookies(c: any) {
	const isProd = process.env.NODE_ENV === "production";
	const opts = {
		path: "/",
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? ("None" as const) : ("Lax" as const),
	};
	deleteCookie(c, "accessToken", opts);
	deleteCookie(c, "refreshToken", opts);
}

function getClientIp(c: any) {
	return c.req.header("x-forwarded-for") || "127.0.0.1";
}

export const register = async (c: any) => {
	const body = await c.req.json();
	const parsed = RegisterSchema.safeParse(body);

	if (!parsed.success) {
		logger.info(parsed);
		return c.json(parsed.error, 409);
	}

	logger.info("successfully parsed");
	const { email, firstName, lastName, password, username } = parsed.data;

	const ip = getClientIp(c);
	const rateLimitKey = `register-rate-limit:${ip}:${email}`;

	const isAllowed = await redis.set(rateLimitKey, "1", "EX", 60, "NX");

	if (!isAllowed) {
		return c.json(
			{
				success: "false",
				message: "Too Many Requests",
			},
			429,
		);
	}

	const isExist = await prisma.user.findUnique({
		where: { email },
	});

	if (isExist) {
		return c.json(
			{
				success: "false",
				message: "User Already Exists",
			},
			404,
		);
	}

	const hashedPassword = await bcrypt.hash(password, 12);
	const verifyToken = crypto.randomBytes(32).toString("hex");

	const dataToStore = JSON.stringify({
		firstName,
		lastName,
		username,
		email,
		password: hashedPassword,
	});

	await redis.set(`verifyKey:${verifyToken}`, dataToStore, "EX", 300, "NX");

	logger.info({ verifyToken }, "token is saved");

	const html = getVerifyEmailHtml({ token: verifyToken.toString(), email });
	const sendEmail = await sendResendEmail({
		to: email,
		subject: "verify",
		html,
	});
	logger.info(sendEmail);

	if (!sendEmail) {
		return c.json(
			{
				success: "false",
				message: "Failed to send OTP",
			},
			400,
		);
	}

	await redis.set(rateLimitKey, "true", "EX", 60, "NX");

	return c.json(
		{
			success: true,
			message: "If your email is right then check your inbox ",
		},
		200,
	);
};

export const verify = async (c: any) => {
	const tokenParam = c.req.param("token");
	const unvalidated = {
		token: String(tokenParam ?? "")
			.toLowerCase()
			.trim(),
	};

	const parsed = ValidateRegisterSchema.safeParse(unvalidated);

	logger.info(parsed);
	if (!parsed.success) return c.json(parsed.error, 400);

	const stored = await redis.get(`verifyKey:${parsed.data.token}`);
	if (!stored) {
		return c.json({ success: false, message: "Invalid or expired token" }, 400);
	}

	const { firstName, lastName, email, username, password } = JSON.parse(stored);

	const alreadyExist = await prisma.user.findUnique({
		where: { email },
	});

	logger.info({ alreadyExist }, "if user exists");
	if (alreadyExist) {
		return c.json(
			{
				success: "false",
				message: "User Already Exists",
			},
			409,
		);
	}

	await prisma.user.create({
		data: { email, firstName, lastName, username, password },
	});

	await redis.del(`verifyKey:${parsed.data.token}`);

	return c.json(
		{
			success: "true",
			message: "User registered successfully",
		},
		201,
	);
};

export const login = async (c: any) => {
	const body = await c.req.json();
	const parsed = LoginSchema.safeParse(body);

	logger.info(parsed.data);
	if (!parsed.success) return c.json(parsed.error, 400);

	const { email, password } = parsed.data;

	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		return c.json({ success: false, message: "Invalid credentials" }, 401);
	}

	const passwordOk = await bcrypt.compare(password, user.password);

	if (!passwordOk) {
		return c.json({ success: false, message: "Invalid credentials" }, 401);
	}

	const otp = Math.floor(100000 + Math.random() * 900000).toString();

	const stored = await redis.set(otpKey(email), otp, "EX", 300, "NX");
	if (!stored) {
		return c.json(
			{ success: false, message: "OTP already sent. Wait 5 minutes." },
			429,
		);
	}

	const html = getOtpHtml({ email, otp });
	const sent = await sendResendEmail({ to: email, subject: "Login OTP", html });
	if (!sent) {
		await redis.del(otpKey(email));
		return c.json({ success: false, message: "Failed to send OTP" }, 500);
	}

	return c.json({ success: true, message: "OTP sent to your email" }, 200);
};

export const verifyLoginOTP = async (c: any) => {
	const body = await c.req.json();
	const ip = getClientIp(c);
	const rateKey = `login-otp-rate:${ip}:${body.email}`;
	const attempts = await redis.incr(rateKey);
	if (attempts === 1) await redis.expire(rateKey, 5 * 60);
	if (attempts > 5) {
		return c.json(
			{
				success: false,
				message: "Too many attempts. Wait 5 minutes.",
			},
			429,
		);
	}

	const parsed = ValidateLoginSchema.safeParse(body);
	if (!parsed.success) return c.json(parsed.error, 400);

	const { email, otp, publicKeyJwk, browser, os, deviceType, deviceName } =
		parsed.data;

	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		return c.json({ success: false, message: "User not found" }, 404);
	}

	const storedOtp = await redis.get(otpKey(email));
	if (!storedOtp) {
		return c.json({ success: false, message: "OTP expired" }, 400);
	}
	if (storedOtp !== otp) {
		return c.json({ success: false, message: "Invalid OTP" }, 400);
	}

	await redis.del(otpKey(email));
	await redis.del(rateKey);

	const sessionId = crypto.randomUUID();
	const familyId = crypto.randomUUID();

	let publicKeyThumbprint: string | undefined;
	if (publicKeyJwk) {
		logger.info({ publicKeyJwk }, "public key jwk");
		publicKeyThumbprint = await computeJwkThumbprint(publicKeyJwk);
	}

	const refreshToken = generateRefreshToken(user.id, sessionId, familyId);
	generateAccessToken(user.id, sessionId, familyId, c); // sets cookie

	const TTL = 7 * 24 * 60 * 60; // 7 days in seconds

	const pipeline = redis.pipeline();
	pipeline.set(rtKey(user.id, familyId, sessionId), refreshToken, "EX", TTL);
	pipeline.sadd(familyKey(familyId), sessionId);
	pipeline.expire(familyKey(familyId), TTL);
	if (publicKeyJwk) {
		pipeline.set(
			`pubkey:${sessionId}`,
			JSON.stringify(publicKeyJwk),
			"EX",
			TTL,
		);
	}
	await pipeline.exec();

	const isProd = process.env.NODE_ENV === "production";
	setCookie(c, "refreshToken", refreshToken, {
		path: "/",
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? "None" : "Lax",
		maxAge: TTL, // seconds
	});

	await prisma.session.create({
		data: {
			id: sessionId,
			sessionToken: refreshToken,
			familyId,
			userId: user.id,
			expiresAt: new Date(Date.now() + TTL * 1000),
			ipAddress: ip ?? null,
			userAgent: c.req.header("user-agent") ?? null,
			browser: browser ?? null,
			os: os ?? null,
			deviceType: deviceType ?? null,
			deviceName: deviceName ?? null,
			publicKeyThumbprint: publicKeyThumbprint ?? null,
		},
	});

	return c.json({ success: true, message: "Login successful" }, 200);
};

export const checkUsername = async (c: any) => {
	const body = await c.req.json();
	const { username } = body;

	if (!username) {
		return c.json({ available: false }, 400);
	}

	const isTaken = await prisma.user.findUnique({
		where: { username },
	});

	if (!isTaken) {
		return c.json(
			{
				success: true,
				available: true,
				message: `${username} is available`,
			},
			200,
		);
	}

	return c.json(
		{
			success: true,
			available: false,
			message: "this username is Not available",
		},
		200,
	);
};

export const refreshTokenController = async (c: any) => {
	const refreshToken = getCookie(c, "refreshToken");
	logger.info({ refreshToken }, "refresh token : ");
	if (!refreshToken) {
		return c.json({ success: false, message: "No refresh token" }, 401);
	}

	const decoded = verifyRefreshToken(refreshToken);
	if (!decoded) {
		clearAuthCookies(c);
		return c.json(
			{ success: false, message: "Session expired. Please log in." },
			401,
		);
	}

	const { userId, sessionId, familyId } = decoded;

	const storedToken = await redis.get(rtKey(userId, familyId, sessionId));

	if (!storedToken) {
		const sessionIds = await redis.smembers(familyKey(familyId));

		const pipeline = redis.pipeline();
		for (const sid of sessionIds) {
			pipeline.del(rtKey(userId, familyId, sid));
		}
		pipeline.del(familyKey(familyId));
		await pipeline.exec();

		if (sessionIds.length > 0) {
			await prisma.session.deleteMany({
				where: { userId, familyId, id: { in: sessionIds } },
			});
		}

		await redis.del(userCacheKey(userId));

		clearAuthCookies(c);
		return c.json(
			{
				success: false,
				message:
					"Token reuse detected. All sessions for this login have been revoked.",
			},
			401,
		);
	}

	const dpopProof = c.req.header("dpop-proof");

	if (dpopProof) {
		const session = await prisma.session.findUnique({
			where: { id: sessionId },
		});

		if (session?.publicKeyThumbprint) {
			const storedJwk = await redis.get(`pubkey:${sessionId}`);
			logger.info({ storedJwk }, "storedJwk");
			logger.info({ dpopProof }, "dpopProof");
			if (storedJwk) {
				const popValid = await verifyDpopProof({
					proofJwt: dpopProof,
					publicKeyJwk: JSON.parse(storedJwk),
					expectedMethod: "POST",
					expectedUrl: `${BASE_URL}/api/v1/auth/refresh`,
					jtiCache: {
						has: async (jti) => {
							const exists = await redis.exists(`dpop-jti:${jti}`);
							return exists === 1;
						},
						set: async (jti) => {
							await redis.set(`dpop-jti:${jti}`, "1", "EX", 60);
						},
					},
				});

				if (!popValid) {
					return c.json({ success: false, message: "PoP proof invalid" }, 401);
				}
			}
		}
	}

	await redis.del(rtKey(userId, familyId, sessionId));

	const newRefreshToken = generateRefreshToken(userId, sessionId, familyId);
	const TTL = 7 * 24 * 60 * 60;

	await redis.set(
		rtKey(userId, familyId, sessionId),
		newRefreshToken,
		"EX",
		TTL,
	);

	generateAccessToken(userId, sessionId, familyId, c);
	const isProd = process.env.NODE_ENV === "production";
	setCookie(c, "refreshToken", newRefreshToken, {
		path: "/",
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? "None" : "Lax",
		maxAge: TTL, // seconds
	});

	await prisma.session.update({
		where: { id: sessionId },
		data: {
			sessionToken: newRefreshToken,
			expiresAt: new Date(Date.now() + TTL * 1000),
			lastUsedAt: new Date(),
		},
	});

	return c.json({ success: true, message: "Token refreshed" }, 200);
};

export const validateUser = async (c: any) => {
	const userPayload = c.get("user");
	const { userId } = userPayload;

	const cached = await redis.get(userCacheKey(userId));
	if (cached) {
		return c.json({ success: true, user: JSON.parse(cached) }, 200);
	}

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			firstName: true,
			lastName: true,
			username: true,
			email: true,
			avatar: true,
			createdAt: true,
		},
	});

	if (!user) {
		return c.json({ success: false, message: "User not found" }, 404);
	}

	const formattedUser = {
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		username: user.username,
		name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
		email: user.email,
		avatar: user.avatar,
		createdAt: user.createdAt,
	};

	await redis.set(
		userCacheKey(userId),
		JSON.stringify(formattedUser),
		"EX",
		5 * 60,
	);
	return c.json({ success: true, user: formattedUser }, 200);
};

export const getAllSessions = async (c: any) => {
	const userPayload = c.get("user");
	const { userId, sessionId: currentSessionId } = userPayload;

	const sessions = await prisma.session.findMany({
		where: {
			userId,
			expiresAt: { gt: new Date() },
		},
		select: {
			id: true,
			createdAt: true,
			expiresAt: true,
			lastUsedAt: true,
			ipAddress: true,
			browser: true,
			os: true,
			deviceType: true,
			deviceName: true,
		},
		orderBy: { lastUsedAt: "desc" },
	});

	const withCurrent = sessions.map((s) => ({
		...s,
		isCurrent: s.id === currentSessionId,
	}));

	return c.json({ success: true, sessions: withCurrent }, 200);
};

export const logout = async (c: any) => {
	const userPayload = c.get("user");
	const { userId, sessionId, familyId } = userPayload;

	const pipeline = redis.pipeline();
	pipeline.del(rtKey(userId, familyId, sessionId));
	pipeline.srem(familyKey(familyId), sessionId);
	pipeline.set(`blacklist:${sessionId}`, "1", "EX", 7 * 24 * 60 * 60);
	await pipeline.exec();

	await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});

	clearAuthCookies(c);
	return c.json({ success: true, message: "Logged out" }, 200);
};

export const logoutAll = async (c: any) => {
	const userPayload = c.get("user");
	const { userId } = userPayload;

	const sessions = await prisma.session.findMany({
		where: { userId },
		select: { id: true, familyId: true },
	});

	if (sessions.length > 0) {
		const pipeline = redis.pipeline();
		for (const s of sessions) {
			pipeline.del(rtKey(userId, s.familyId, s.id));
			pipeline.srem(familyKey(s.familyId), s.id);
			pipeline.set(`blacklist:${s.id}`, "1", "EX", 7 * 24 * 60 * 60);
		}
		const uniqueFamilies = [...new Set(sessions.map((s) => s.familyId))];
		for (const fid of uniqueFamilies) {
			pipeline.del(familyKey(fid));
		}
		pipeline.del(userCacheKey(userId));
		await pipeline.exec();

		await prisma.session.deleteMany({ where: { userId } });
	}

	clearAuthCookies(c);
	return c.json({ success: true, message: "All sessions revoked" }, 200);
};

export const revokeSession = async (c: any) => {
	const userPayload = c.get("user");
	const { userId } = userPayload;
	const targetId = c.req.param("sessionId");

	const session = await prisma.session.findUnique({ where: { id: targetId } });
	if (!session || session.userId !== userId) {
		return c.json({ success: false, message: "Session not found" }, 404);
	}

	const pipeline = redis.pipeline();
	pipeline.del(rtKey(userId, session.familyId, targetId));
	pipeline.srem(familyKey(session.familyId), targetId);
	pipeline.set(`blacklist:${targetId}`, "1", "EX", 7 * 24 * 60 * 60);
	await pipeline.exec();

	await prisma.session.delete({ where: { id: targetId } });

	return c.json({ success: true, message: "Session revoked" }, 200);
};

export const editUser = async (c: any) => {
	const body = await c.req.json();
	const { id, firstName, lastName, username, email, avatar } = body;

	if (!id) {
		return c.json(
			{
				success: false,
				message: "User ID is required to update.",
			},
			400,
		);
	}

	const savedUser = await prisma.user.update({
		where: { id },
		data: {
			firstName,
			lastName,
			email,
			username,
			avatar,
		},
	});

	await redis.del(`user:${id}`);

	return c.json(
		{
			success: true,
			message: "User updated successfully",
			data: savedUser,
		},
		200,
	);
};

export const forgotPassword = async (c: any) => {
	const body = await c.req.json();
	const { email } = body;

	const randomId = crypto.randomUUID();

	sendResendEmail({
		to: email,
		subject: "Forgot password",
		html: getForgotPasswordHtml({ token: randomId, email }),
	});

	await redis.set(`verifyKey:${randomId}`, email, "EX", 3600, "NX");

	return c.json(
		{
			success: true,
			message: "Reset password email sent successfully",
		},
		200,
	);
};
