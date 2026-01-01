import { Router } from "express";
 import authRoutes from "./auth.route"

const router = Router();

// /api/auth/...
router.use("/auth", authRoutes);
router.use("/categories", authRoutes);

export default router;
