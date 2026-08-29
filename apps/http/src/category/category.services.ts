import { prisma } from "@repo/db";

export async function getCategoriesService() {
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

	return categories.map((cat: (typeof categories)[number]) => ({
		_id: cat.id,
		name: cat.name,
		icon: cat.icon,
		quizzes: cat._count.Quiz,
	}));
}

export async function getQuizzesByCategoryService(categoryId: string) {
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

	return quizzes.map((q: any) => ({
		_id: q.id,
		quizNumber: q.quizNumber,
		title: q.title,
		totalQuestions: q._count?.Question ?? q._count?.questions ?? 0,
	}));
}
