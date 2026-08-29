import { Router } from "express";
import newAuthRouter from "../auth/auth.routes.js";
import categoryRoutes from "../category/category.routes.js";
import friendRoutes from "../friend/friend.routes.js";
import gameRoutes from "../game/game.routes.js";
import quizRoutes from "../quiz/quiz.routes.js";
import roomRoutes from "../room/room.routes.js";

const router = Router();

// Feature routes
router.use("/auth", newAuthRouter);
router.use("/categories", categoryRoutes);
router.use("/quizzes", quizRoutes);
router.use("/room", roomRoutes);
router.use("/game", gameRoutes);
router.use("/", friendRoutes);

export default router;
