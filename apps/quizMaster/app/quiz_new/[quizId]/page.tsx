import ClientQuizPlayer from "./ClientQuizPlayer";
import QuizAuthGuard from "@/components/QuizAuthGuard";

import QuizNotFound from "./components/QuizNotFound";

type QuizPageProps = {
  params: {
    quizId: string;
  };
};

export default async function QuizPage({ params }: QuizPageProps) {
  const { quizId } = params;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/quizzes/${quizId}`,
      {
        cache: "no-store", // 👈 VERY IMPORTANT for quizzes
      }
    );

    if (!res.ok) {
      console.error("❌ Quiz API failed");
      return (
        <QuizNotFound
          title="Server Took an L 💥"
          message="Our servers are having a tiny meltdown. Refreshing the page to fix it..."
        />
      );
    }

    const data = await res.json();

    if (!data.success || !data.formattedQuiz) {
      console.warn("⚠️ Quiz not found:", quizId);
      return (
        <QuizNotFound
          title="Quiz Broken 💀"
          message="The quiz data looks corrupted. Reloading to fix the glitch..."
        />
      );
    }

    console.log(data.formattedQuiz)

    return (
      <div className="min-h-[80dvh]">
        {/* 🔐 AUTH LOGIC HERE (CLIENT-SIDE, SAFE) */}
        <QuizAuthGuard>
          <ClientQuizPlayer quiz={data.formattedQuiz} />
        </QuizAuthGuard>
      </div>
    );
  } catch (error) {
    console.error("❌ Error loading quiz:", error);
    return (
      <div className="min-h-[80dvh] flex justify-center items-center">
        <p className="text-red-500">Something went wrong 😓</p>
      </div>
    );
  }
}
