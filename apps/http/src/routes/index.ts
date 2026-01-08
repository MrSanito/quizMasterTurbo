import { Router } from "express";
 import authRoutes from "./auth.route.ts"
 import categoriesRoutes from "./categories.route.ts"
 import quizzesRoutes from "./quizzes.route.ts";

const router = Router();

// /api/auth/...
router.use("/auth", authRoutes);
router.use("/categories/", categoriesRoutes);
router.use("/quizzes/", quizzesRoutes);

export default router;
