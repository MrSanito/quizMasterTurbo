import type { Request, Response } from "express";
import { logger } from "../utils/logger.js";
import {
	getQuizHistoryService,
	getQuizResultByAttemptService,
	getQuizService,
	submitQuizService,
} from "./quiz.services.js";

/* ================= GET QUIZ ================= */

export const getQuiz = async (
	req: Request<{ quizId: string }>,
	res: Response,
) => {
	const { quizId } = req.params;

	if (!quizId) {
		return res.status(400).json({
			success: false,
			message: "Quiz ID is required in the URL parameters",
		});
	}

	try {
		const formattedQuiz = await getQuizService(quizId);
		if (!formattedQuiz) {
			return res.status(404).json({
				success: false,
				message: "Quiz not found",
			});
		}

		return res.status(200).json({
			success: true,
			formattedQuiz,
		});
	} catch (err) {
		console.error("getQuiz error:", err);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch quiz",
		});
	}
};

/* ================= SUBMIT QUIZ ================= */

interface SubmitQuizBody {
	score: number;
	total: number;
	timeTaken: number;
	questions: any[];
	userId?: string;
	guestId?: string;
}

export const submitQuiz = async (
	req: Request<{ quizId: string }, {}, SubmitQuizBody>,
	res: Response,
) => {
	try {
		const { quizId } = req.params;
		const { score, total, timeTaken, questions, userId, guestId } = req.body;

		logger.info({ quizId, score, total, timeTaken, userId, guestId }, "Submitting quiz attempt");

		if (
			typeof score !== "number" ||
			typeof total !== "number" ||
			typeof timeTaken !== "number" ||
			!Array.isArray(questions)
		) {
			logger.warn({ body: req.body }, "Invalid quiz submit payload");
			return res.status(400).json({
				success: false,
				message: "Invalid payload: score, total, timeTaken must be numbers and questions must be an array",
			});
		}

		if ((userId && guestId) || (!userId && !guestId)) {
			logger.warn({ userId, guestId }, "Must provide exactly one of userId or guestId");
			return res.status(400).json({
				success: false,
				message: "Either userId or guestId is required",
			});
		}

		const attempt = await submitQuizService({
			quizId,
			score,
			total,
			timeTaken,
			questions,
			userId,
			guestId,
		});

		logger.info({ attemptId: attempt.id }, "Quiz submitted successfully");

		return res.status(201).json({
			success: true,
			attemptId: attempt.id,
		});
	} catch (err: any) {
		console.error("Quiz submit error:", err);
		return res.status(500).json({
			success: false,
			message: "Failed to submit quiz",
			error: err?.message,
		});
	}
};

/* ================= RESULT BY ATTEMPT ================= */

export const getQuizResultByAttemptId = async (
	req: Request<{ attemptId: string }>,
	res: Response,
) => {
	try {
		const { attemptId } = req.params;
		const { auth }: any = req.query;

		if (!auth) {
			return res.status(400).json({
				success: false,
				message: "auth query missing",
			});
		}

		let authContext: any;

		try {
			const authPayload = JSON.parse(auth);
			if (authPayload.userId) {
				authContext = { type: "user", userId: authPayload.userId };
			} else if (authPayload.guestId) {
				authContext = { type: "guest", guestId: authPayload.guestId };
			} else {
				throw new Error();
			}
		} catch {
			return res.status(400).json({
				success: false,
				message: "Invalid auth format",
			});
		}

		const result = await getQuizResultByAttemptService(attemptId, authContext);
		if (result.error === "NOT_FOUND") {
			return res.status(404).json({
				success: false,
				message: "Quiz attempt not found",
			});
		}
		if (result.error === "FORBIDDEN") {
			return res.status(403).json({
				success: false,
				message: "Access denied: this attempt is not yours",
			});
		}

		return res.status(200).json({
			success: true,
			attempt: result.attempt,
		});
	} catch (err) {
		console.error("Fetch attempt error:", err);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch quiz result",
		});
	}
};

/* ================= QUIZ HISTORY ================= */

export const getQuizHistory = async (req: Request, res: Response) => {
	try {
		const { viewerId, viewerType } = req.query as {
			viewerId?: string;
			viewerType?: "user" | "guest";
		};

		if (!viewerId || !viewerType) {
			return res.status(400).json({
				success: false,
				message: "viewerId and viewerType are required",
			});
		}

		const attempts = await getQuizHistoryService(viewerId, viewerType);

		return res.status(200).json({
			success: true,
			attempts,
		});
	} catch (err) {
		console.error("History fetch error:", err);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch quiz history",
		});
	}
};
