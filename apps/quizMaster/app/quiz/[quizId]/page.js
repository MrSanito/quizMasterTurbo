import connectToDatabase from "@/lib/mongodb";
import Quiz from "@/models/Quiz";
import ClientQuizPlayer from "./ClientQuizPlayer";
import { headers } from "next/headers";
import Link from "next/link";

export default async function QuizPage({ params }) {
  const isBlocked = headers().get("x-quiz-blocked") === "true";

  console.log(isBlocked);
  if (isBlocked) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-500">Limit reached 🚫</h1>

          <p className="mt-2 text-red-400">chala ja bsdk </p>
          <p className="mt-2 text-gray-400">
            You’ve played 3 free quizzes. Login to continue your grind 💪
          </p>

          <Link
            href="/register"
            className="inline-block mt-4 mr-3 rounded bg-blue-600 px-4 py-2 text-white"
          >
            Register
          </Link>
          <Link
            href="/login"
            className="inline-block mt-4 mr-3 rounded bg-blue-600 px-4 py-2 text-white"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  try {
    await connectToDatabase();
    const { quizId } = params;

    console.log("📌 Fetching quiz for quiz ID:", quizId);

    const quiz = await Quiz.findById(quizId).lean();

    if (!quiz) {
      console.warn("⚠️ No quiz found with ID:", quizId);
      return <p className="text-white">⚠️ Quiz not found.</p>;
    }

    console.log("✅ Fetched Quiz:", quiz);

    return <ClientQuizPlayer quiz={quiz} />;
  } catch (error) {
    console.error("❌ Error fetching quiz:", error);
    return <p className="text-red-500">Something went wrong 😓</p>;
  }
}
