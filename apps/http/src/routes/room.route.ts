import { Router } from "express";
import { createRoom, getRoom, getRoomResult } from "../controllers/room.controller";

const router = Router();
router.post("/:roomId", createRoom)
router.get("/:roomId", getRoom) //get specific room details all user and all thing
router.get("/:roomId/result", getRoomResult)



export default router;