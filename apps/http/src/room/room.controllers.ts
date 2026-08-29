import type { Request, Response } from "express";
import { logger } from "../utils/logger.js";
import {
	createRoomService,
	finalizeRoomService,
	getRoomByNameService,
	getRoomResultService,
	startRoomService,
	updateLobbyStateService,
} from "./room.services.js";

export const createRoom = async (req: Request, res: Response) => {
	const { hostId, roomName, quizId } = req.body;
	logger.info({ hostId, roomName, quizId });

	try {
		await createRoomService({ hostId, roomName, quizId });
		return res.status(201).json({
			success: true,
			message: "Room created successfully",
		});
	} catch (error: any) {
		console.error("Room creation error:", error);
		if (error.code === "P2003") {
			return res.status(400).json({
				success: false,
				message: "Invalid host user",
			});
		}
		return res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

export const getRoom = async (req: Request, res: Response) => {
	const roomId = Array.isArray(req.params.roomId)
		? req.params.roomId[0]
		: req.params.roomId;

	if (!roomId) {
		return res.status(400).json({ success: false, message: "Room ID required" });
	}

	const room = await getRoomByNameService(roomId);
	return res.status(200).json({
		success: true,
		message: "Success at Getting room",
		room,
	});
};

export const getRoomResult = async (req: Request, res: Response) => {
	const roomId = Array.isArray(req.params.roomId)
		? req.params.roomId[0]
		: req.params.roomId;

	if (!roomId) {
		return res.status(400).json({ success: false, message: "Room ID required" });
	}

	try {
		const result = await getRoomResultService(roomId);
		if (!result) {
			return res.status(404).json({ success: false, message: "Room not found" });
		}

		return res.status(200).json({
			success: true,
			...result,
		});
	} catch (error) {
		console.error("Get Room Result Error:", error);
		return res.status(500).json({ success: false, message: "Server error" });
	}
};

export const updateLobby = async (req: Request, res: Response) => {
	const roomId = Array.isArray(req.params.roomId)
		? req.params.roomId[0]
		: req.params.roomId;

	const { hostId } = req.body;
	if (!roomId) {
		return res.status(400).json({ success: false, message: "Room ID required" });
	}

	try {
		const result = await updateLobbyStateService(roomId, hostId);
		if (result.error === "NOT_FOUND") {
			return res.status(404).json({ success: false, message: "Room not found" });
		}
		if (result.error === "FORBIDDEN") {
			return res.status(403).json({ success: false, message: "Only host can update room" });
		}
		if (result.error === "GAME_FINISHED") {
			return res.status(400).json({ success: false, message: "Game already finished" });
		}
		if (result.alreadyInLobby) {
			return res.status(200).json({ success: true, message: "Room already in lobby" });
		}

		return res.status(200).json({
			success: true,
			message: "Room is now in lobby",
			data: result.updatedRoom,
		});
	} catch (error) {
		console.error("Lobby update error:", error);
		return res.status(500).json({ success: false, message: "Server error" });
	}
};

export const startRoom = async (req: Request, res: Response) => {
	const roomId = Array.isArray(req.params.roomId)
		? req.params.roomId[0]
		: req.params.roomId;

	if (!roomId) {
		return res.status(400).json({ success: false, message: "Invalid Room ID" });
	}

	try {
		const result = await startRoomService(roomId);
		if (result.error === "NOT_FOUND") {
			return res.status(404).json({ success: false, message: "Room not found" });
		}
		if (result.error === "NO_QUESTIONS") {
			return res.status(400).json({
				success: false,
				message: "Quiz has no questions! Cannot start.",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Game starting",
			synced: result.synced,
		});
	} catch (error) {
		console.error("Start room error:", error);
		return res.status(500).json({ success: false, message: "Server error" });
	}
};

export const finalizeRoom = async (req: Request, res: Response) => {
	const roomId = Array.isArray(req.params.roomId)
		? req.params.roomId[0]
		: req.params.roomId;

	if (!roomId) {
		return res.status(400).json({ success: false, message: "Invalid Room ID" });
	}

	try {
		const result = await finalizeRoomService(roomId);
		if (result.error === "NOT_FOUND") {
			return res.status(404).json({ success: false, message: "Room not found" });
		}

		return res.status(200).json({ success: true, message: "Game finalized" });
	} catch (error) {
		console.error("Finalize game error:", error);
		return res.status(500).json({ success: false, message: "Server error" });
	}
};
