"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ClientQuizPlayer from "./ClientQuizPlayer";
import QuizNotFound from "./components/QuizNotFound";
import { useUser } from "../../(auth)/context/GetUserContext";
import Loading from "@/components/Loading";
import NotLoginComponent from "../../(auth)/components/NotLoginComponent";
import MaxTryReached from "../../(auth)/components/MaxTryReached";

type QuizPageProps = {
  params: {
    quizId: string;
  };
};

export default function QuizPage({ params }) {
  const { quizId } = params;
  const { loading, isLogin, isGuest, isMaxTryReached } = useUser();
  const [quiz, setQuiz] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 🚫 Don't fetch if auth blocks the page
    if (loading || isMaxTryReached || (!isLogin && !isGuest) || !quizId) return;

    const fetchQuiz = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/quizzes/${quizId}`,
          {
            cache: "no-store",
          }
        );

        if (!res.ok) {
          console.error("❌ Quiz API failed");
          setError("Server Took an L 💥");
          return;
        }

        const data = await res.json();

        if (!data.success || !data.formattedQuiz) {
          console.warn("⚠️ Quiz not found:", quizId);
          setError("Quiz Broken 💀");
          return;
        }

        console.log(data.formattedQuiz);
        setQuiz(data.formattedQuiz);
      } catch (err) {
        console.error("❌ Error loading quiz:", err);
        setError("Something went wrong 😓");
      } finally {
        setPageLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, loading, isLogin, isGuest, isMaxTryReached]);

  /* ---------------- GUARDS (AFTER HOOKS) ---------------- */

  // 1️⃣ Auth loading
  if (loading) {
    return <Loading />;
  }

  // 2️⃣ Guest blocked
  if (isMaxTryReached) {
    return <MaxTryReached />;
  }

  // 3️⃣ Not logged in & not guest
  if (!isLogin && !isGuest) {
    return <NotLoginComponent />;
  }

  // 4️⃣ Page data loading
  if (pageLoading) {
    return (
      <div className="min-h-[80dvh] flex items-center justify-center text-white">
        Loading quiz… 🧠⚡
      </div>
    );
  }

  // 5️⃣ Error states
  if (error) {
    if (error === "Server Took an L 💥") {
      return (
        <QuizNotFound
          title="Server Took an L 💥"
          message="Our servers are having a tiny meltdown. Refreshing the page to fix it..."
        />
      );
    }
    if (error === "Quiz Broken 💀") {
      return (
        <QuizNotFound
          title="Quiz Broken 💀"
          message="The quiz data looks corrupted. Reloading to fix the glitch..."
        />
      );
    }
    return (
      <div className="min-h-[80dvh] flex justify-center items-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // 6️⃣ Show quiz
  if (quiz) {
    return (
      <div className="min-h-[80dvh]">
        <ClientQuizPlayer quiz={quiz} />
      </div>
    );
  }

  return null;
}
