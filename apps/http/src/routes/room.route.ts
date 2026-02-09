import { Router } from "express";
import { createRoom, getRoom, getRoomResult, updateLobby, startRoom, finalizeRoom } from "../controllers/room.controller";

const router = Router();
router.post("/:roomId", createRoom)
router.get("/:roomId", getRoom) //get specific room details all user and all thing
router.post("/:roomId/lobby", updateLobby) //get specific room details all user and all thing
router.get("/:roomId/result", getRoomResult)
router.post("/:roomId/start", startRoom)
router.post("/:roomId/finalize", finalizeRoom)



export default router;