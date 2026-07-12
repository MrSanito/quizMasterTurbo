import { Router } from "express";
import categoriesRoutes from "./categories.route.js"
import quizzesRoutes from "./quizzes.route.js";
import roomRoutes from "./room.route.js";
import gameRoutes from "./game.route.js";
import newAuthRouter from "../auth/auth.routes.js"
import friendsRoutes from "./friends.route.js";
import { isAuthenticated } from "../auth/auth.middleware.js";

const router = Router();

// /api/auth/...
router.use("/auth", newAuthRouter);
router.use("/categories/", categoriesRoutes);
router.use("/quizzes/", quizzesRoutes);
router.use("/room/", roomRoutes);
router.use("/game/", gameRoutes);
router.use("/friends", isAuthenticated, friendsRoutes);

export default router;
