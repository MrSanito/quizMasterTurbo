import { Hono } from "hono";
import {
	getQuiz,
	getQuizHistory,
	getQuizResultByAttemptId,
	submitQuiz,
} from "../controllers/quizzes.controller.js";

const router = new Hono();

router.get("/history", getQuizHistory);
router.get("/result/:attemptId", getQuizResultByAttemptId);
router.get("/:quizId", getQuiz);
router.post("/:quizId/submit", submitQuiz);

export default router;
