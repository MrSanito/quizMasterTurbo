import { randomUUID } from "node:crypto";
import { prisma } from "@repo/db";

function shuffleArray<T>(array: T[]): T[] {
	return [...array].sort(() => Math.random() - 0.5);
}

export async function getQuizService(quizId: string) {
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

	if (!quiz) return null;

	return {
		_id: quiz.id,
		quizNumber: quiz.quizNumber,
		title: quiz.title,
		categoryId: quiz.categoryId,
		timeLimit: quiz.timeLimit,
		totalPoints: quiz.Question.reduce((sum: number, q: any) => sum + q.points, 0),
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
}

export async function submitQuizService(data: {
	quizId: string;
	score: number;
	total: number;
	timeTaken: number;
	questions: any[];
	userId?: string;
	guestId?: string;
}) {
	return await prisma.quizAttempt.create({
		data: {
			id: randomUUID(),
			quizId: data.quizId,
			userId: data.userId ?? null,
			guestId: data.guestId ?? null,
			score: data.score,
			total: data.total,
			timeTaken: data.timeTaken,
			questions: data.questions,
		},
	});
}

export async function getQuizResultByAttemptService(
	attemptId: string,
	authContext: { type: "user" | "guest"; userId?: string; guestId?: string },
) {
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

	if (!attempt) return { error: "NOT_FOUND" };

	const isUserMatch =
		authContext.userId && attempt.userId === authContext.userId;
	const isGuestMatch =
		authContext.guestId && attempt.guestId === authContext.guestId;

	if (!isUserMatch && !isGuestMatch) {
		return { error: "FORBIDDEN" };
	}

	return { attempt };
}

export async function getQuizHistoryService(
	viewerId: string,
	viewerType: "user" | "guest",
) {
	const where =
		viewerType === "user" ? { userId: viewerId } : { guestId: viewerId };

	return await prisma.quizAttempt.findMany({
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
}
