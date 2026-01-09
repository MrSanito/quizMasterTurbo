import { Router } from "express";
 import { getQuiz,getQuizHistory, getQuizResultByAttemptId, historyQuiz, submitQuiz } from "../controllers/quizzes.controller.js";


const router = Router();
router.get("/history/", getQuizHistory);
 router.get("/result/:attemptId", getQuizResultByAttemptId);


router.get("/:quizId", getQuiz );
router.post("/:quizId/submit", submitQuiz);




export default router;
