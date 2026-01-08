import { prisma } from "@repo/db/lib/prisma.ts";

// export const fetchCategories = async (req: Request, res: Response) => {
//   try {
//     const categories = await prisma.category.findMany({
//       select: {
//         id: true,
//         name: true,
//         icon: true,
//         _count: {
//           select: {
//             quizzes: true,
//           },
//         },
//       },
//     });

//     const formatted = categories.map((cat) => ({
//       _id: cat.id,
//       name: cat.name,
//       icon: cat.icon,
//       quizzes: cat._count.quizzes,
//     }));

//     res.status(200).json({
//       success: true,
//       formatted,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch categories", error:err });
//   }

// };

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

    const formattedCategories = categories.map((cat) => ({
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
    console.log(error);
    return res.status(404).json({
      success: false,
      error,
    });
  }
};


export const fetchQuizzies = async ( req: Request , res: Response) => { 
    const { categoryId } = req.params;
    console.log(categoryId)

    try {
       const quizzes = await prisma.quiz.findMany({
         where: { categoryId },
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

       console.log(quizzes)

       const formatted = quizzes.map((q) => ({
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
        error,
      });
      
    }


    
  }