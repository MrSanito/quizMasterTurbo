import "./config.js";
import http from "node:http";
import express from "express";
import { setupSocket } from "./socket.js";

import { RedisManager } from "./core/RedisManager.js";
import { GameEngine } from "./core/GameEngine.js";

const app = express(); //  attach express
const server = http.createServer(app); // use SAME server

try {
	setupSocket(server);
} catch (err) {
	console.error("Failed to set up socket server:", err);
	process.exit(1);
}

const PORT = process.env.PORT || 3002; // Render provides PORT

server.listen(PORT, async () => {
	console.log(` WS Server running on port ${PORT}`);

	// Initialize Lua scripts & perform crash recovery on boot
	try {
		await RedisManager.getInstance().loadLuaScripts();
		await GameEngine.getInstance().recoverActiveRooms();
	} catch (startupErr) {
		console.error("Error during startup initialization:", startupErr);
	}
});

app.get("/ping", (_req, res) => {
	res.status(200).send("pong");
});

app.get("/health", (_req, res) => {
	res.status(200).json({ status: "ok", uptime: process.uptime() });
});
