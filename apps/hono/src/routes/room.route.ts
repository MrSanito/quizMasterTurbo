import { Hono } from "hono";
import {
	createRoom,
	finalizeRoom,
	getRoom,
	getRoomResult,
	startRoom,
	updateLobby,
} from "../controllers/room.controller.js";

const router = new Hono();

router.post("/:roomId", createRoom);
router.get("/:roomId", getRoom);
router.post("/:roomId/lobby", updateLobby);
router.get("/:roomId/result", getRoomResult);
router.post("/:roomId/start", startRoom);
router.post("/:roomId/finalize", finalizeRoom);

export default router;
