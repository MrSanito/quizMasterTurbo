import redis from "@repo/redis";
import { getCookie } from "hono/cookie";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger.js";

export type HonoEnv = {
	Variables: {
		user: {
			userId: string;
			sessionId: string;
		};
	};
};

export const isAuthenticated = async (c: any, next: any) => {
	const token = getCookie(c, "accessToken");

	if (!token) {
		return c.json({ success: "false", message: "Unauthorized" }, 401);
	}

	try {
		const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as {
			userId: string;
			sessionId: string;
		};

		// ✅ check if token is blacklisted (logged out)
		const isBlacklisted = await redis.get(`blacklist:${decoded.sessionId}`);
		if (isBlacklisted) {
			return c.json(
				{ success: "false", message: "Token has been revoked" },
				401,
			);
		}

		logger.info(decoded);
		c.set("user", decoded);
		logger.info(c.get("user"));
		await next();
	} catch (_error) {
		return c.json(
			{ success: "false", message: "Invalid or expired access token" },
			401,
		);
	}
};
