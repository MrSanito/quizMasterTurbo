import { Hono } from "hono";
import { getGameResult, saveGame } from "../controllers/game.controller.js";

const router = new Hono();

router.post("/save", saveGame);
router.get("/:roomId/result", getGameResult);

export default router;
