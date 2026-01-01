import connectToDatabase from "@/lib/mongodb";
import Quiz from "@/models/Quiz";
import Link from "next/link";

// ✅ Fetch quizzes inside the page (no API needed)
export default async function QuizzesPage({ params }) {
  await connectToDatabase(); // Ensure DB is connected
  const { categoryId } = params; // Dynamic route param

  console.log("📌 Fetching quizzes for category:", categoryId);

  try {
    const quizzes = await Quiz.find({ categoryId }).lean();
    console.log("✅ Fetched Quizzes:", quizzes);
    if (!quizzes.length) {
      console.warn("⚠️ No quizzes found for category:", categoryId);
      return (
        <p className="text-white">⚠️ No quizzes available for this category.</p>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-6">
        <h1 className="text-3xl font-bold text-white mb-6">Choose a Quiz</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
          {quizzes.map((quiz) => (
            <Link
              key={quiz._id}
              href={`/quiz/${quiz._id}`}
              className="group flex flex-col items-center bg-gray-800 p-5 rounded-lg shadow-lg text-white hover:bg-gray-700 hover:scale-105 transition-all"
            >
              <h2 className="text-lg font-semibold group-hover:text-blue-400">
                {quiz.title}
              </h2>
              <p className="text-gray-400">
                ⏰ Time Limit: {quiz.timeLimit} mins
              </p>
              <p className="text-gray-400">
                🎯 Total Points: {quiz.totalPoints}
              </p>
            </Link>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error("❌ Error fetching quizzes:", error.message);
    return <p className="text-white">⚠️ Failed to load quizzes.</p>;
  }
}
