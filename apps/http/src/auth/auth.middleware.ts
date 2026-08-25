import redis from "@repo/redis";
import type { NextFunction, Request, Response } from "express";
// middleware/auth.middleware.ts
// middleware/auth.middleware.ts
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger.js";

export const isAuthenticated = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const token = req.cookies.accessToken;

	if (!token) {
		return res.status(401).json({ success: "false", message: "Unauthorized" });
	}

	try {
		const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as {
			userId: string;
			sessionId: string;
		};

		// ✅ check if token is blacklisted (logged out)
		const isBlacklisted = await redis.get(`blacklist:${decoded.sessionId}`);
		if (isBlacklisted) {
			return res
				.status(401)
				.json({ success: "false", message: "Token has been revoked" });
		}

		logger.info(decoded);
		req.user = decoded;
		logger.info(req.user);
		next();
	} catch {
		return res
			.status(401)
			.json({ success: "false", message: "Invalid or expired access token" });
	}
};
