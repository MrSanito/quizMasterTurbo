import { Router } from "express";
import { getGameResult, saveGame } from "../controllers/game.controller.js";

const router = Router();

router.post("/save", saveGame);
router.get("/:roomId/result", getGameResult);

export default router;
