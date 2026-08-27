import { prisma } from "@repo/db";
import { logger } from "../utils/logger.js";
import { catchAsync } from "../utils/catchAsync.js";

/* ================= FETCH CATEGORIES ================= */

export const fetchCategories = catchAsync(async (c: any) => {
	logger.info({ DATABASE_URL: process.env.DATABASE_URL }, "DATABASE_URL =>");

	const categories = await prisma.category.findMany({
		select: {
			id: true,
			name: true,
			icon: true,
			_count: {
				select: { Quiz: true },
			},
		},
	});
	logger.info(categories);

	const formattedCategories = categories.map((cat: any) => ({
		_id: cat.id,
		name: cat.name,
		icon: cat.icon,
		quizzes: cat._count.Quiz,
	}));

	return c.json(
		{
			success: true,
			categories: formattedCategories,
		},
		200,
	);
});

/* ================= FETCH QUIZZES BY CATEGORY ================= */

export const fetchQuizzies = catchAsync(async (c: any) => {
	const categoryId = c.req.param("categoryId");

	const quizzes = await prisma.quiz.findMany({
		where: { categoryId },
		orderBy: {
			quizNumber: "asc",
		},
		select: {
			id: true,
			quizNumber: true,
			title: true,
			_count: {
				select: {
					Question: true,
				},
			},
		},
	});

	const formatted = quizzes.map((q: any) => ({
		_id: q.id,
		quizNumber: q.quizNumber,
		title: q.title,
		totalQuestions: q._count.Question ?? q._count.questions,
	}));

	return c.json(
		{
			success: true,
			quizzes: formatted,
		},
		200,
	);
});
