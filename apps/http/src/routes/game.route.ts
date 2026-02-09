
import { Router } from "express";
import { saveGame, getGameResult } from "../controllers/game.controller.js";

const router = Router();

router.post("/save", saveGame);
router.get("/:roomId/result", getGameResult);

export default router;
