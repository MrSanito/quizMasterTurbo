import { Router } from "express";
import {
	getQuiz,
	getQuizHistory,
	getQuizResultByAttemptId,
	submitQuiz,
} from "./quiz.controllers.js";

const router = Router();

router.get("/history", getQuizHistory);
router.get("/attempt/:attemptId", getQuizResultByAttemptId);
router.get("/result/:attemptId", getQuizResultByAttemptId); // Frontend result route
router.get("/:quizId", getQuiz);
router.post("/:quizId/submit", submitQuiz);

export default router;
