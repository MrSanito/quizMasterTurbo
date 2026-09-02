import crypto from "node:crypto";
import { prisma } from "@repo/db";
import redis from "@repo/redis";
import {
	LoginSchema,
	RegisterSchema,
	ValidateLoginSchema,
	ValidateRegisterSchema,
} from "@repo/types";
import type { Request, Response } from "express";
import { TryCatch } from "../middleware/tryCatch.js";
import { logger } from "../utils/logger.js";
import {
	clearAuthCookies,
	editUserService,
	forgotPasswordService,
	getAllUserSessionsService,
	getUserProfileService,
	loginWithOtpService,
	logoutAllSessionsService,
	logoutSessionService,
	refreshSessionService,
	registerService,
	revokeSpecificSessionService,
	verifyLoginOtpService,
	verifyRegistrationService,
} from "./auth.services.js";

// ─── Register ────────────────────────────────────────────────────────────────

export const register = TryCatch(async (req: Request, res: Response) => {
	const parsed = RegisterSchema.safeParse(req.body);
	if (!parsed.success) {
		logger.info(parsed);
		return res.status(409).json(parsed.error);
	}

	const rateLimitKey = `register-rate-limit:${req.ip}:${parsed.data.email}`;
	const isAllowed = await redis.set(rateLimitKey, "1", "EX", 60, "NX");
	if (!isAllowed) {
		return res.status(429).json({
			success: "false",
			message: "Too Many Requests",
		});
	}

	try {
		await registerService(parsed.data);
		await redis.set(rateLimitKey, "true", "EX", 60, "NX");

		return res.status(200).json({
			success: true,
			message: "If your email is right then check your inbox",
		});
	} catch (err: any) {
		if (err.message === "USER_EXISTS") {
			return res.status(404).json({ success: "false", message: "User Already Exists" });
		}
		if (err.message === "EMAIL_SEND_FAILED") {
			return res.status(400).json({ success: "false", message: "Failed to send OTP" });
		}
		throw err;
	}
});

// ─── Verify Registration ─────────────────────────────────────────────────────

export const verify = TryCatch(async (req: Request, res: Response) => {
	const unvalidated = {
		token: String(req.params.token ?? "")
			.toLowerCase()
			.trim(),
	};

	const parsed = ValidateRegisterSchema.safeParse(unvalidated);
	if (!parsed.success) return res.status(400).json(parsed.error);

	try {
		await verifyRegistrationService(parsed.data.token);
		return res.status(201).json({
			success: "true",
			message: "User registered successfully",
		});
	} catch (err: any) {
		if (err.message === "INVALID_OR_EXPIRED_TOKEN") {
			return res.status(400).json({ success: false, message: "Invalid or expired token" });
		}
		if (err.message === "USER_EXISTS") {
			return res.status(409).json({ success: "false", message: "User Already Exists" });
		}
		throw err;
	}
});

// ─── Login (Send OTP) ────────────────────────────────────────────────────────

export const login = TryCatch(async (req: Request, res: Response) => {
	const parsed = LoginSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json(parsed.error);

	try {
		await loginWithOtpService(parsed.data.email, parsed.data.password);
		return res.status(200).json({ success: true, message: "OTP sent to your email" });
	} catch (err: any) {
		if (err.message === "INVALID_CREDENTIALS") {
			return res.status(401).json({ success: false, message: "Invalid credentials" });
		}
		if (err.message === "OTP_ALREADY_SENT") {
			return res.status(429).json({ success: false, message: "OTP already sent. Wait 5 minutes." });
		}
		if (err.message === "EMAIL_SEND_FAILED") {
			return res.status(500).json({ success: false, message: "Failed to send OTP" });
		}
		throw err;
	}
});

// ─── Verify Login OTP ────────────────────────────────────────────────────────

export const verifyLoginOTP = TryCatch(async (req: Request, res: Response) => {
	const rateKey = `login-otp-rate:${req.ip}:${req.body.email}`;
	const attempts = await redis.incr(rateKey);
	if (attempts === 1) await redis.expire(rateKey, 5 * 60);
	if (attempts > 5) {
		return res.status(429).json({
			success: false,
			message: "Too many attempts. Wait 5 minutes.",
		});
	}

	const parsed = ValidateLoginSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json(parsed.error);

	try {
		await verifyLoginOtpService(
			{
				...parsed.data,
				ip: req.ip,
				userAgent: req.headers["user-agent"],
			},
			res,
		);
		await redis.del(rateKey);

		return res.status(200).json({ success: true, message: "Login successful" });
	} catch (err: any) {
		if (err.message === "USER_NOT_FOUND") {
			return res.status(404).json({ success: false, message: "User not found" });
		}
		if (err.message === "OTP_EXPIRED") {
			return res.status(400).json({ success: false, message: "OTP expired" });
		}
		if (err.message === "INVALID_OTP") {
			return res.status(400).json({ success: false, message: "Invalid OTP" });
		}
		throw err;
	}
});

// ─── Check Username ──────────────────────────────────────────────────────────

export const checkUsername = TryCatch(async (req: Request, res: Response) => {
	const { username } = req.body;
	if (!username) {
		return res.status(400).json({ available: false });
	}

	const isTaken = await prisma.user.findUnique({
		where: { username },
	});

	if (!isTaken) {
		return res.json({
			success: true,
			available: true,
			message: `${username} is available`,
		});
	}

	return res.status(200).json({
		success: true,
		available: false,
		message: "this username is Not available",
	});
});

// ─── Refresh Token ───────────────────────────────────────────────────────────

export const refreshTokenController = TryCatch(async (req: Request, res: Response) => {
	const { refreshToken } = req.cookies;
	if (!refreshToken) {
		return res.status(401).json({ success: false, message: "No refresh token" });
	}

	const dpopProof = req.headers["dpop-proof"] as string | undefined;

	try {
		await refreshSessionService(refreshToken, dpopProof, res);
		return res.status(200).json({ success: true, message: "Token refreshed" });
	} catch (err: any) {
		if (err.message === "EXPIRED_TOKEN") {
			return res.status(401).json({ success: false, message: "Session expired. Please log in." });
		}
		if (err.message === "TOKEN_REUSE_DETECTED") {
			return res.status(401).json({
				success: false,
				message: "Token reuse detected. All sessions for this login have been revoked.",
			});
		}
		if (err.message === "INVALID_DPOP") {
			return res.status(401).json({ success: false, message: "PoP proof invalid" });
		}
		throw err;
	}
});

// ─── Validate User (me) ──────────────────────────────────────────────────────

export const validateUser = TryCatch(async (req: Request, res: Response) => {
	const { userId } = req.user;
	const user = await getUserProfileService(userId);

	if (!user) {
		return res.status(404).json({ success: false, message: "User not found" });
	}

	return res.status(200).json({ success: true, user });
});

// ─── Get All Active Sessions ─────────────────────────────────────────────────

export const getAllSessions = TryCatch(async (req: Request, res: Response) => {
	const { userId, sessionId } = req.user;
	const sessions = await getAllUserSessionsService(userId, sessionId);

	return res.status(200).json({ success: true, sessions });
});

// ─── Logout (Single Session) ─────────────────────────────────────────────────

export const logout = TryCatch(async (req: Request, res: Response) => {
	const { userId, sessionId, familyId } = req.user;
	await logoutSessionService(userId, sessionId, familyId);
	clearAuthCookies(res);

	return res.status(200).json({ success: true, message: "Logged out" });
});

// ─── Logout All Sessions ─────────────────────────────────────────────────────

export const logoutAll = TryCatch(async (req: Request, res: Response) => {
	const { userId } = req.user;
	await logoutAllSessionsService(userId);
	clearAuthCookies(res);

	return res.status(200).json({ success: true, message: "All sessions revoked" });
});

// ─── Revoke Specific Session ─────────────────────────────────────────────────

export const revokeSession = TryCatch(async (req: Request, res: Response) => {
	const { userId } = req.user;
	const targetId = req.params.sessionId as string;

	try {
		await revokeSpecificSessionService(userId, targetId);
		return res.status(200).json({ success: true, message: "Session revoked" });
	} catch (err: any) {
		if (err.message === "SESSION_NOT_FOUND") {
			return res.status(404).json({ success: false, message: "Session not found" });
		}
		throw err;
	}
});

// ─── Edit User ───────────────────────────────────────────────────────────────

export const editUser = TryCatch(async (req: Request, res: Response) => {
	const { id, firstName, lastName, username, email, avatar } = req.body;
	if (!id) {
		return res.status(400).json({
			success: false,
			message: "User ID is required to update.",
		});
	}

	const savedUser = await editUserService({
		id,
		firstName,
		lastName,
		username,
		email,
		avatar,
	});

	return res.status(200).json({
		success: true,
		message: "User updated successfully",
		data: savedUser,
	});
});

// ─── Forgot Password ─────────────────────────────────────────────────────────

export const forgotPassword = TryCatch(async (req: Request, res: Response) => {
	const { email } = req.body;
	await forgotPasswordService(email);

	return res.status(200).json({
		success: true,
		message: "Reset password email sent successfully",
	});
});

export const generateWsTicket = TryCatch(async (req: Request, res: Response) => {
	const { userId, sessionId } = req.user;

	const ticket = crypto.randomUUID();
	// 30 seconds ephemeral single-use ticket
	await redis.set(
		`ws-ticket:${ticket}`,
		JSON.stringify({ userId, sessionId }),
		"EX",
		30,
	);

	return res.status(200).json({ success: true, ticket });
});

