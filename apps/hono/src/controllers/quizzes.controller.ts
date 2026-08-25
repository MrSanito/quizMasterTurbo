import { randomUUID } from "node:crypto";
import { prisma } from "@repo/db";
import { logger } from "../utils/logger.js";

/* ================= GET QUIZ ================= */

export const getQuiz = async (c: any) => {
	logger.info("get quiz");
	const quizId = c.req.param("quizId");

	if (!quizId) {
		return c.json(
			{
				success: false,
				message: "Quiz ID is required in the URL parameters",
			},
			400,
		);
	}

	try {
		const quiz = await prisma.quiz.findUnique({
			where: { id: quizId },
			select: {
				id: true,
				quizNumber: true,
				title: true,
				categoryId: true,
				timeLimit: true,
				Question: {
					select: {
						id: true,
						questionText: true,
						points: true,
						negativePoints: true,
						Option: {
							select: {
								id: true,
								text: true,
								isCorrect: true,
							},
						},
					},
				},
			},
		});

		if (!quiz) {
			return c.json(
				{
					success: false,
					message: "Quiz not found",
				},
				404,
			);
		}

		function shuffleArray<T>(array: T[]): T[] {
			return [...array].sort(() => Math.random() - 0.5);
		}

		const formattedQuiz = {
			_id: quiz.id,
			quizNumber: quiz.quizNumber,
			title: quiz.title,
			categoryId: quiz.categoryId,
			timeLimit: quiz.timeLimit,
			totalPoints: quiz.Question.reduce((sum, q) => sum + q.points, 0),
			questions: quiz.Question.map((q: any) => ({
				_id: q.id,
				questionText: q.questionText,
				points: q.points,
				negativePoints: q.negativePoints,
				options: shuffleArray(
					q.Option.map((o: any) => ({
						_id: o.id,
						text: o.text,
						isCorrect: o.isCorrect,
					})),
				),
			})),
		};

		return c.json(
			{
				success: true,
				formattedQuiz,
			},
			200,
		);
	} catch (err) {
		logger.error(err, "getQuiz error:");
		return c.json(
			{
				success: false,
				message: "Failed to fetch quiz",
			},
			500,
		);
	}
};

/* ================= SUBMIT QUIZ ================= */

export const submitQuiz = async (c: any) => {
	try {
		const quizId = c.req.param("quizId");
		const body = await c.req.json();
		const { score, total, timeTaken, questions, userId, guestId } = body;

		if (
			typeof score !== "number" ||
			typeof total !== "number" ||
			typeof timeTaken !== "number" ||
			!Array.isArray(questions)
		) {
			return c.json(
				{
					success: false,
					message: "Invalid payload",
				},
				400,
			);
		}

		if ((userId && guestId) || (!userId && !guestId)) {
			return c.json(
				{
					success: false,
					message: "Either userId or guestId is required",
				},
				400,
			);
		}

		const attempt = await prisma.quizAttempt.create({
			data: {
				id: randomUUID(),
				quizId,
				userId: userId ?? null,
				guestId: guestId ?? null,
				score,
				total,
				timeTaken,
				questions,
			},
		});

		return c.json(
			{
				success: true,
				attemptId: attempt.id,
			},
			201,
		);
	} catch (err) {
		logger.error(err, "Quiz submit error:");
		return c.json(
			{
				success: false,
				message: "Failed to submit quiz",
			},
			500,
		);
	}
};

/* ================= RESULT BY ATTEMPT ================= */

export const getQuizResultByAttemptId = async (c: any) => {
	try {
		const attemptId = c.req.param("attemptId");
		const auth = c.req.query("auth");

		if (!auth) {
			return c.json(
				{
					success: false,
					message: "auth query missing",
				},
				400,
			);
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
			return c.json(
				{
					success: false,
					message: "Invalid auth format",
				},
				400,
			);
		}

		const attempt = await prisma.quizAttempt.findUnique({
			where: { id: attemptId },
			include: {
				Quiz: {
					select: {
						title: true,
						quizNumber: true,
						categoryId: true,
						Question: {
							select: {
								id: true,
								questionText: true,
								Option: {
									select: {
										text: true,
										isCorrect: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!attempt) {
			return c.json(
				{
					success: false,
					message: "Quiz attempt not found",
				},
				404,
			);
		}

		const isUserMatch =
			authContext.userId && attempt.userId === authContext.userId;

		const isGuestMatch =
			authContext.guestId && attempt.guestId === authContext.guestId;

		if (!isUserMatch && !isGuestMatch) {
			return c.json(
				{
					success: false,
					message: "Access denied: this attempt is not yours",
				},
				403,
			);
		}

		return c.json(
			{
				success: true,
				attempt,
			},
			200,
		);
	} catch (err) {
		logger.error(err, "Fetch attempt error:");
		return c.json(
			{
				success: false,
				message: "Failed to fetch quiz result",
			},
			500,
		);
	}
};

/* ================= QUIZ HISTORY ================= */

export const getQuizHistory = async (c: any) => {
	try {
		const viewerId = c.req.query("viewerId");
		const viewerType = c.req.query("viewerType");

		if (!viewerId || !viewerType) {
			return c.json(
				{
					success: false,
					message: "viewerId and viewerType are required",
				},
				400,
			);
		}

		const where =
			viewerType === "user" ? { userId: viewerId } : { guestId: viewerId };

		const attempts = await prisma.quizAttempt.findMany({
			where,
			orderBy: { createdAt: "desc" },
			take: 10,
			select: {
				id: true,
				score: true,
				total: true,
				timeTaken: true,
				createdAt: true,
				Quiz: {
					select: {
						id: true,
						title: true,
						categoryId: true,
					},
				},
			},
		});

		return c.json(
			{
				success: true,
				attempts,
			},
			200,
		);
	} catch (err) {
		logger.error(err, "History fetch error:");
		return c.json(
			{
				success: false,
				message: "Failed to fetch quiz history",
			},
			500,
		);
	}
};
