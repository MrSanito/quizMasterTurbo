import type { Request, Response } from "express";
import { logger } from "../utils/logger.js";
import {
	getGameResultService,
	saveGameResultsService,
} from "./game.services.js";

/* ================= SAVE GAME ================= */

export const saveGame = async (req: Request, res: Response) => {
	try {
		const { roomId, results } = req.body;

		if (!roomId) {
			return res.status(400).json({
				success: false,
				message: "roomId is required",
			});
		}

		logger.info(`[GameController] Saving game results for room: ${roomId}`);
		await saveGameResultsService(roomId, results);

		return res.status(200).json({
			success: true,
			message: "Game saved successfully",
		});
	} catch (error: any) {
		console.error("[GameController] Save Game Error:", error);
		return res.status(500).json({
			success: false,
			message: "Internal Server Error",
			error: error.message,
		});
	}
};

/* ================= GET RESULT ================= */

export const getGameResult = async (req: Request, res: Response) => {
	try {
		const { roomId } = req.params;

		if (!roomId || typeof roomId !== "string") {
			return res.status(400).json({
				success: false,
				message: "roomId is required and must be a string",
			});
		}

		const data = await getGameResultService(roomId);
		if (!data) {
			return res.status(404).json({
				success: false,
				message: "Room not found",
			});
		}

		return res.status(200).json({
			success: true,
			roomName: data.roomName,
			state: data.state,
			results: data.results,
		});
	} catch (error: any) {
		console.error("[GameController] Get Result Error:", error);
		return res.status(500).json({
			success: false,
			message: "Internal Server Error",
			error: error.message,
		});
	}
};
