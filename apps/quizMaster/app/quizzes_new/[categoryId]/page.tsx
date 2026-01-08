"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import axios from "axios";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

import { useUser } from "@/app/(auth)/context/GetUserContext";
import Loading from "@/app/Loading";
import NotLoginComponent from "@/app/(auth)/Components/NotLoginComponent";
import MaxTryReached from "@/app/(auth)/Components/MaxTryReached";

type Quiz = {
  _id: string;
  quizNumber: number;
  title: string;
  totalQuestions: number;
};

export default function QuizzesByCategoryPage() {
  /* ---------------- HOOKS (ALWAYS FIRST) ---------------- */

  const { categoryId } = useParams();
  const router = useRouter();

  const { loading, isLogin, isGuest, isMaxTryReached } = useUser();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  /* ---------------- DATA FETCH ---------------- */

  useEffect(() => {
    // 🚫 Stop everything if auth blocks page
    if (loading || isMaxTryReached || (!isLogin && !isGuest) || !categoryId) {
      return;
    }

    const fetchQuizzes = async () => {
      try {
        console.log("fetching quizzes for category 👉", categoryId);

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories/${categoryId}/quizzes`
        );

        console.log("QUIZZES 👉", res.data.quizzes);
        setQuizzes(res.data.quizzes);
      } catch (err) {
        console.error("❌ Failed to fetch quizzes", err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchQuizzes();
  }, [categoryId, loading, isLogin, isGuest, isMaxTryReached]);

  /* ---------------- AUTH GUARDS (SAME AS DASHBOARD) ---------------- */

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

  // 4️⃣ Page loading
  if (pageLoading) {
    return (
      <div className="min-h-[80dvh] flex items-center justify-center text-white">
        Loading quizzes… 🧠⚡
      </div>
    );
  }

  /* ---------------- EMPTY STATE ---------------- */

  if (quizzes.length === 0) {
    return (
      <div className="min-h-[80dvh] flex flex-col items-center justify-center text-white gap-4">
        <p className="text-xl">No quizzes here yet 😴</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
        >
          Go back
        </button>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-[80dvh] px-4 py-10 max-w-5xl mx-auto">
      {/* 🏷️ Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl sm:text-4xl font-bold text-white mb-10 text-center"
      >
        Pick a Quiz 🧠🔥
      </motion.h1>

      {/* 🧩 Quiz Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {quizzes.map((quiz, index) => (
          <motion.div
            key={quiz._id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href={`/quiz_new/${quiz._id}`}
              className="block rounded-xl p-6 text-white shadow-xl
                         bg-gradient-to-br from-emerald-500 to-teal-600"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm opacity-80">Quiz #{quiz.quizNumber}</p>
                  <h2 className="text-xl font-semibold">{quiz.title}</h2>
                  <p className="text-sm opacity-80 mt-1">
                    {quiz.totalQuestions} questions
                  </p>
                </div>

                <ArrowRightIcon className="w-6 h-6 opacity-80" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
