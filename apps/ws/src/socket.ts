import type http from "node:http";
import { instrument } from "@socket.io/admin-ui";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { redis } from "./services/redis.service.js";
import { registerConnection } from "./handler/connction.js";

export function setupSocket(server: http.Server) {
	const io = new Server(server, {
		path: "/socket.io/", //  prevents path mismatch

		cors: {
			origin: [
				"https://admin.socket.io",
				"http://localhost:3000",
				"https://quiz-master-turbo-quiz-master.vercel.app",
				"https://quizmaster.zynito.in",
				"http://quizmaster.zynito.in",
			],
			methods: ["GET", "POST"], //  required for handshake
			credentials: true,
		},

		transports: ["websocket", "polling"], //  Render sleep fix
		allowUpgrades: true,
		pingTimeout: 60000, //  stop random drops
		pingInterval: 25000,
	});

	instrument(io, { auth: false });

	// 🔐 Auth Middleware: Validate JWT & Redis Blacklist
	io.use(async (socket, next) => {
		try {
			// Extract token from auth payload, authorization header, or cookies
			let token =
				socket.handshake.auth?.token ||
				socket.handshake.headers?.authorization;

			if (token?.startsWith("Bearer ")) {
				token = token.slice(7).trim();
			}

			// Fallback: Check handshake cookie if not sent via auth/header
			if (!token && socket.handshake.headers?.cookie) {
				const cookies = Object.fromEntries(
					socket.handshake.headers.cookie
						.split(";")
						.map((c) => c.trim().split("="))
						.map(([k, ...v]) => [k, decodeURIComponent(v.join("="))])
				);
				token = cookies.accessToken;
			}

			if (!token) {
				return next(new Error("Authentication token required"));
			}

			const secret = process.env.ACCESS_TOKEN_SECRET;
			if (!secret) {
				console.error("ACCESS_TOKEN_SECRET is not configured");
				return next(new Error("Server authentication configuration error"));
			}

			// 1. Verify Access Token
			const decoded = jwt.verify(token, secret) as {
				userId: string;
				sessionId: string;
			};

			// 2. Check if revoked/blacklisted in Redis
			const isBlacklisted = await redis.get(`blacklist:${decoded.sessionId}`);
			if (isBlacklisted) {
				return next(new Error("Token has been revoked"));
			}

			// 3. Attach decoded user info to socket data
			socket.data.user = decoded;
			next();
		} catch (err: any) {
			return next(new Error("Unauthorized: " + (err.message || "Invalid or expired token")));
		}
	});

	io.on("connection", (socket) => registerConnection(io, socket));

	
	// ✅ GRACEFUL SHUTDOWN
	const shutdown = async () => {
		console.log("Shutting down server...");

		io.close(() => {
			console.log("Socket.IO closed");
		});

		server.close(() => {
			console.log("HTTP server closed");
			process.exit(0);
		});
	};

	// Ctrl + C
	process.on("SIGINT", shutdown);

	// nodemon restart
	process.on("SIGTERM", shutdown);
}
