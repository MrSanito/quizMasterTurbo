import { Request, Response } from "express";
import { prisma } from "@repo/db"; // ✅ correct import

/* ================= FETCH CATEGORIES ================= */

export const fetchCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        icon: true,
        _count: {
          select: { quizzes: true },
        },
      },
    });

    const formattedCategories = categories.map((cat: typeof categories[number]) => ({
      _id: cat.id,
      name: cat.name,
      icon: cat.icon,
      quizzes: cat._count.quizzes,
    }));

    return res.status(200).json({
      success: true,
      categories: formattedCategories,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

/* ================= FETCH QUIZZES BY CATEGORY ================= */

export const fetchQuizzies = async (
  req: Request<{ categoryId: string }>,
  res: Response
) => {
  const { categoryId } = req.params;

  try {
    const quizzes = await prisma.quiz.findMany({
      where: { categoryId },
      orderBy: {
        quizNumber: "asc", // 🔥 SORT HERE
      },
      select: {
        id: true,
        quizNumber: true,
        title: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

 
    const formatted = quizzes.map((q:any) => ({
      _id: q.id,
      quizNumber: q.quizNumber,
      title: q.title,
      totalQuestions: q._count.questions,
    }));

    return res.status(200).json({
      success: true,
      quizzes: formatted,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch quizzes",
    });
  }
};
