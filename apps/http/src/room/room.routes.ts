import { Router } from "express";
import {
	createRoom,
	finalizeRoom,
	getRoom,
	getRoomResult,
	startRoom,
	updateLobby,
} from "./room.controllers.js";

const router = Router();

router.post("/create", createRoom);
router.get("/:roomId", getRoom);
router.post("/:roomId/lobby", updateLobby);
router.post("/:roomId/start", startRoom);
router.post("/:roomId/finalize", finalizeRoom);
router.get("/:roomId/result", getRoomResult);

export default router;
