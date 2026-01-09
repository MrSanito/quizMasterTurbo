import { Router } from "express";
 import authRoutes from "./auth.route.js"
 import categoriesRoutes from "./categories.route.js"
 import quizzesRoutes from "./quizzes.route.js";

const router = Router();

// /api/auth/...
router.use("/auth", authRoutes);
router.use("/categories/", categoriesRoutes);
router.use("/quizzes/", quizzesRoutes);

export default router;
