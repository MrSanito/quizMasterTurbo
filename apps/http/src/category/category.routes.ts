import { Router } from "express";
import {
	fetchCategories,
	fetchQuizzies,
} from "./category.controllers.js";

const router = Router();

router.get("/", fetchCategories);
router.get("/:categoryId/quizzes", fetchQuizzies);

export default router;
