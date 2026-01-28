// import { prisma } from "./lib/prisma";
import { prisma } from "../db/dist/client.js";

const CATEGORY_NAME = "Tech & Coding"; // ⚠️ CHANGE THIS to the category you want to delete

async function main() {
  console.log(`🗑️  Starting deletion for category: "${CATEGORY_NAME}"...`);

  // 1. Find the category
  const category = await prisma.category.findUnique({
    where: { name: CATEGORY_NAME },
  });

  if (!category) {
    console.log(`❌ Category "${CATEGORY_NAME}" not found. Nothing to delete.`);
    return;
  }

  console.log(`📍 Found Category ID: ${category.id}`);

  // 2. Find all Quizzes in this category
  const quizzes = await prisma.quiz.findMany({
    where: { categoryId: category.id },
    select: { id: true },
  });

  const quizIds = quizzes.map((q) => q.id);
  console.log(`📉 Found ${quizIds.length} quizzes to remove.`);

  if (quizIds.length > 0) {
    // 3. Find all Questions in these quizzes (to delete their options first)
    const questions = await prisma.question.findMany({
      where: { quizId: { in: quizIds } },
      select: { id: true },
    });
    const questionIds = questions.map((q) => q.id);

    // 4. Delete Options (Child of Questions)
    if (questionIds.length > 0) {
      const deletedOptions = await prisma.option.deleteMany({
        where: { questionId: { in: questionIds } },
      });
      console.log(`   - Deleted ${deletedOptions.count} options.`);
    }

    // 5. Delete Questions (Child of Quizzes)
    const deletedQuestions = await prisma.question.deleteMany({
      where: { quizId: { in: quizIds } },
    });
    console.log(`   - Deleted ${deletedQuestions.count} questions.`);

    // 6. Delete Quizzes (Child of Category)
    const deletedQuizzes = await prisma.quiz.deleteMany({
      where: { categoryId: category.id },
    });
    console.log(`   - Deleted ${deletedQuizzes.count} quizzes.`);
  }

  // 7. Finally, delete the Category
  await prisma.category.delete({
    where: { id: category.id },
  });

  console.log(`✅ Successfully deleted category: "${CATEGORY_NAME}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
