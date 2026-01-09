import { Router } from "express";
import { fetchCategories ,fetchQuizzies} from "../controllers/categories.controller.js";


const router = Router();

router.get("/", fetchCategories);
router.get("/:categoryId/quizzes", fetchQuizzies);

export default router;
