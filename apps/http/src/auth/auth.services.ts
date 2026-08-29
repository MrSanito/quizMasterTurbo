import crypto from "node:crypto";
import type { Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "@repo/db";
import redis from "@repo/redis";
import {
	getForgotPasswordHtml,
	getOtpHtml,
	getVerifyEmailHtml,
} from "../configs/email.js";
import { sendResendEmail } from "../configs/resend.js";
import { logger } from "../utils/logger.js";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const TTL = 7 * 24 * 60 * 60; // 7 days in seconds

// ─── Token generation ────────────────────────────────────────────────────────

export function generateAccessToken(
	userId: string,
	sessionId: string,
	familyId: string,
	res: Response,
) {
	const token = jwt.sign({ userId, sessionId, familyId }, ACCESS_SECRET, {
		expiresIn: "15m",
	});
	const isProd = process.env.NODE_ENV === "production";
	res.cookie("accessToken", token, {
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? "none" : "lax",
		maxAge: 15 * 60 * 1000,
	});
	return token;
}

export function verifyAccessToken(
	token: string,
): { userId: string; sessionId: string; familyId: string } | null {
	try {
		return jwt.verify(token, ACCESS_SECRET) as any;
	} catch {
		return null;
	}
}

export function generateRefreshToken(
	userId: string,
	sessionId: string,
	familyId: string,
): string {
	return jwt.sign({ userId, sessionId, familyId }, REFRESH_SECRET, {
		expiresIn: "7d",
	});
}

export function verifyRefreshToken(
	token: string,
): { userId: string; sessionId: string; familyId: string } | null {
	try {
		return jwt.verify(token, REFRESH_SECRET) as any;
	} catch {
		return null;
	}
}

export function clearAuthCookies(res: Response) {
	const isProd = process.env.NODE_ENV === "production";
	const opts = {
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? ("none" as const) : ("lax" as const),
	};
	res.clearCookie("accessToken", opts);
	res.clearCookie("refreshToken", opts);
}

// ─── Redis key helpers ───────────────────────────────────────────────────────

export const rtKey = (userId: string, familyId: string, sessionId: string) =>
	`rt:${userId}:${familyId}:${sessionId}`;

export const familyKey = (familyId: string) => `family:${familyId}`;
export const otpKey = (email: string) => `otp:${email}`;
export const userCacheKey = (userId: string) => `user:${userId}`;

// ─── PoP helpers ─────────────────────────────────────────────────────────────

export async function computeJwkThumbprint(jwk: {
	kty: string;
	crv: string;
	x: string;
	y: string;
}): Promise<string> {
	const canonical = JSON.stringify({
		crv: jwk.crv,
		kty: jwk.kty,
		x: jwk.x,
		y: jwk.y,
	});
	return crypto.createHash("sha256").update(canonical).digest("base64url");
}

export async function verifyDpopProof(opts: {
	proofJwt: string;
	publicKeyJwk: any;
	expectedMethod: string;
	expectedUrl: string;
	jtiCache: {
		has: (jti: string) => Promise<boolean>;
		set: (jti: string) => Promise<void>;
	};
}): Promise<boolean> {
	try {
		const [headerB64, payloadB64, signatureB64] = opts.proofJwt.split(".");
		if (!headerB64 || !payloadB64 || !signatureB64) return false;

		const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
		const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

		if (header.typ !== "dpop+jwt" || header.alg !== "ES256") return false;
		if (payload.htm !== opts.expectedMethod) return false;
		if (payload.htu !== opts.expectedUrl) return false;

		const now = Math.floor(Date.now() / 1000);
		if (Math.abs(now - payload.iat) > 120) return false;

		if (await opts.jtiCache.has(payload.jti)) return false;
		await opts.jtiCache.set(payload.jti);

		const key = crypto.createPublicKey({
			key: opts.publicKeyJwk,
			format: "jwk",
		});

		return crypto.verify(
			"sha256",
			Buffer.from(`${headerB64}.${payloadB64}`),
			key,
			Buffer.from(signatureB64, "base64url"),
		);
	} catch {
		return false;
	}
}

// ─── Business Logic Services ─────────────────────────────────────────────────

export async function registerService(data: {
	firstName: string;
	lastName: string;
	email: string;
	username: string;
	password: string;
}) {
	const isExist = await prisma.user.findUnique({
		where: { email: data.email },
	});
	if (isExist) {
		throw new Error("USER_EXISTS");
	}

	const hashedPassword = await bcrypt.hash(data.password, 12);
	const verifyToken = crypto.randomBytes(32).toString("hex");

	await redis.set(
		`verifyKey:${verifyToken}`,
		JSON.stringify({ ...data, password: hashedPassword }),
		"EX",
		300,
		"NX",
	);

	const html = getVerifyEmailHtml({ token: verifyToken, email: data.email });
	const sendEmail = await sendResendEmail({
		to: data.email,
		subject: "Verify your email",
		html,
	});

	if (!sendEmail) {
		throw new Error("EMAIL_SEND_FAILED");
	}

	return { verifyToken };
}

export async function verifyRegistrationService(token: string) {
	const stored = await redis.get(`verifyKey:${token}`);
	if (!stored) {
		throw new Error("INVALID_OR_EXPIRED_TOKEN");
	}

	const { firstName, lastName, email, username, password } = JSON.parse(stored);

	const alreadyExist = await prisma.user.findUnique({ where: { email } });
	if (alreadyExist) {
		throw new Error("USER_EXISTS");
	}

	await prisma.user.create({
		data: { email, firstName, lastName, username, password },
	});

	await redis.del(`verifyKey:${token}`);
}

export async function loginWithOtpService(email: string, password: string) {
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		throw new Error("INVALID_CREDENTIALS");
	}

	const passwordOk = await bcrypt.compare(password, user.password);
	if (!passwordOk) {
		throw new Error("INVALID_CREDENTIALS");
	}

	const otp = Math.floor(100000 + Math.random() * 900000).toString();
	const stored = await redis.set(otpKey(email), otp, "EX", 300, "NX");
	if (!stored) {
		throw new Error("OTP_ALREADY_SENT");
	}

	const html = getOtpHtml({ email, otp });
	const sent = await sendResendEmail({ to: email, subject: "Login OTP", html });
	if (!sent) {
		await redis.del(otpKey(email));
		throw new Error("EMAIL_SEND_FAILED");
	}
}

export async function verifyLoginOtpService(
	opts: {
		email: string;
		otp: string;
		publicKeyJwk?: any;
		browser?: string;
		os?: string;
		deviceType?: string;
		deviceName?: string;
		ip?: string;
		userAgent?: string;
	},
	res: Response,
) {
	const { email, otp, publicKeyJwk } = opts;

	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		throw new Error("USER_NOT_FOUND");
	}

	const storedOtp = await redis.get(otpKey(email));
	if (!storedOtp) {
		throw new Error("OTP_EXPIRED");
	}
	if (storedOtp !== otp) {
		throw new Error("INVALID_OTP");
	}

	await redis.del(otpKey(email));

	const sessionId = crypto.randomUUID();
	const familyId = crypto.randomUUID();

	let publicKeyThumbprint: string | undefined;
	if (publicKeyJwk) {
		publicKeyThumbprint = await computeJwkThumbprint(publicKeyJwk);
	}

	const refreshToken = generateRefreshToken(user.id, sessionId, familyId);
	generateAccessToken(user.id, sessionId, familyId, res);

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
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? "none" : "lax",
		maxAge: TTL * 1000,
	});

	await prisma.session.create({
		data: {
			id: sessionId,
			sessionToken: refreshToken,
			familyId,
			userId: user.id,
			expiresAt: new Date(Date.now() + TTL * 1000),
			ipAddress: opts.ip ?? null,
			userAgent: opts.userAgent ?? null,
			browser: opts.browser ?? null,
			os: opts.os ?? null,
			deviceType: opts.deviceType ?? null,
			deviceName: opts.deviceName ?? null,
			publicKeyThumbprint: publicKeyThumbprint ?? null,
		},
	});
}

export async function refreshSessionService(
	refreshToken: string,
	dpopProof: string | undefined,
	res: Response,
) {
	const decoded = verifyRefreshToken(refreshToken);
	if (!decoded) {
		clearAuthCookies(res);
		throw new Error("EXPIRED_TOKEN");
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
		clearAuthCookies(res);
		throw new Error("TOKEN_REUSE_DETECTED");
	}

	if (dpopProof) {
		const session = await prisma.session.findUnique({
			where: { id: sessionId },
		});
		if (session?.publicKeyThumbprint) {
			const storedJwk = await redis.get(`pubkey:${sessionId}`);
			if (storedJwk) {
				const popValid = await verifyDpopProof({
					proofJwt: dpopProof,
					publicKeyJwk: JSON.parse(storedJwk),
					expectedMethod: "POST",
					expectedUrl: `${BASE_URL}/api/v1/auth/refresh`,
					jtiCache: {
						has: async (jti) => (await redis.exists(`dpop-jti:${jti}`)) === 1,
						set: async (jti) => {
							await redis.set(`dpop-jti:${jti}`, "1", "EX", 60);
						},
					},
				});
				if (!popValid) throw new Error("INVALID_DPOP");
			}
		}
	}

	await redis.del(rtKey(userId, familyId, sessionId));
	const newRefreshToken = generateRefreshToken(userId, sessionId, familyId);

	await redis.set(rtKey(userId, familyId, sessionId), newRefreshToken, "EX", TTL);
	generateAccessToken(userId, sessionId, familyId, res);

	const isProd = process.env.NODE_ENV === "production";
	res.cookie("refreshToken", newRefreshToken, {
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? "none" : "lax",
		maxAge: TTL * 1000,
	});

	await prisma.session.update({
		where: { id: sessionId },
		data: {
			sessionToken: newRefreshToken,
			expiresAt: new Date(Date.now() + TTL * 1000),
			lastUsedAt: new Date(),
		},
	});
}

export async function getUserProfileService(userId: string) {
	const cached = await redis.get(userCacheKey(userId));
	if (cached) return JSON.parse(cached);

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

	if (!user) return null;

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

	await redis.set(userCacheKey(userId), JSON.stringify(formattedUser), "EX", 300);
	return formattedUser;
}

export async function getAllUserSessionsService(userId: string, currentSessionId: string) {
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

	return sessions.map((s: any) => ({
		...s,
		isCurrent: s.id === currentSessionId,
	}));
}

export async function logoutSessionService(
	userId: string,
	sessionId: string,
	familyId: string,
) {
	const pipeline = redis.pipeline();
	pipeline.del(rtKey(userId, familyId, sessionId));
	pipeline.srem(familyKey(familyId), sessionId);
	pipeline.set(`blacklist:${sessionId}`, "1", "EX", TTL);
	await pipeline.exec();

	await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
}

export async function logoutAllSessionsService(userId: string) {
	const sessions = await prisma.session.findMany({
		where: { userId },
		select: { id: true, familyId: true },
	});

	if (sessions.length > 0) {
		const pipeline = redis.pipeline();
		for (const s of sessions) {
			pipeline.del(rtKey(userId, s.familyId, s.id));
			pipeline.srem(familyKey(s.familyId), s.id);
			pipeline.set(`blacklist:${s.id}`, "1", "EX", TTL);
		}
		const uniqueFamilies = [...new Set(sessions.map((s: any) => s.familyId))];
		for (const fid of uniqueFamilies) {
			pipeline.del(familyKey(fid as string));
		}
		pipeline.del(userCacheKey(userId));
		await pipeline.exec();

		await prisma.session.deleteMany({ where: { userId } });
	}
}

export async function revokeSpecificSessionService(userId: string, targetId: string) {
	const session = await prisma.session.findUnique({ where: { id: targetId } });
	if (!session || session.userId !== userId) {
		throw new Error("SESSION_NOT_FOUND");
	}

	const pipeline = redis.pipeline();
	pipeline.del(rtKey(userId, session.familyId, targetId));
	pipeline.srem(familyKey(session.familyId), targetId);
	pipeline.set(`blacklist:${targetId}`, "1", "EX", TTL);
	await pipeline.exec();

	await prisma.session.delete({ where: { id: targetId } });
}

export async function editUserService(data: {
	id: string;
	firstName?: string;
	lastName?: string;
	username?: string;
	email?: string;
	avatar?: string;
}) {
	const savedUser = await prisma.user.update({
		where: { id: data.id },
		data: {
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			username: data.username,
			avatar: data.avatar,
		},
	});

	await redis.del(`user:${data.id}`);
	return savedUser;
}

export async function forgotPasswordService(email: string) {
	const randomId = crypto.randomUUID();

	sendResendEmail({
		to: email,
		subject: "Forgot password",
		html: getForgotPasswordHtml({ token: randomId, email }),
	});

	await redis.set(`verifyKey:${randomId}`, email, "EX", 3600, "NX");
}
