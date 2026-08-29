import type { Request, Response } from "express";
import {
	getCategoriesService,
	getQuizzesByCategoryService,
} from "./category.services.js";

/* ================= FETCH CATEGORIES ================= */

export const fetchCategories = async (_req: Request, res: Response) => {
	try {
		const categories = await getCategoriesService();

		return res.status(200).json({
			success: true,
			categories,
		});
	} catch (error) {
		console.error("fetchCategories error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch categories",
		});
	}
};

/* ================= FETCH QUIZZES BY CATEGORY ================= */

export const fetchQuizzies = async (
	req: Request<{ categoryId: string }>,
	res: Response,
) => {
	const { categoryId } = req.params;

	try {
		const quizzes = await getQuizzesByCategoryService(categoryId);

		return res.status(200).json({
			success: true,
			quizzes,
		});
	} catch (error) {
		console.error("fetchQuizzes error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch quizzes",
		});
	}
};
