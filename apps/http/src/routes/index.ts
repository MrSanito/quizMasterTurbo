import { Router } from "express";
 import authRoutes from "./auth.route.js"
 import categoriesRoutes from "./categories.route.js"
 import quizzesRoutes from "./quizzes.route.js";
 import roomRoutes from "./room.route.js";

const router = Router();

// /api/auth/...
router.use("/auth", authRoutes);
router.use("/categories/", categoriesRoutes);
router.use("/quizzes/", quizzesRoutes);
router.use("/room/", roomRoutes);

export default router;
