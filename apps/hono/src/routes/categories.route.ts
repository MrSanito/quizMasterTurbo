import { Hono } from "hono";
import {
	fetchCategories,
	fetchQuizzies,
} from "../controllers/categories.controller.js";

const router = new Hono();

router.get("/", fetchCategories);
router.get("/:categoryId/quizzes", fetchQuizzies);

export default router;
