import { Router } from "express";
import {
	getGameResult,
	saveGame,
} from "./game.controllers.js";

const router = Router();

router.post("/save", saveGame);
router.get("/result/:roomId", getGameResult);

export default router;
