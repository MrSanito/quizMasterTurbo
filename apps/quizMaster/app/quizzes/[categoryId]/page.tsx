"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import axios from "axios";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

import { useUser } from "../../(auth)/context/GetUserContext";
import Loading from "@/components/Loading";
import NotLoginComponent from "../../(auth)/components/NotLoginComponent";
import MaxTryReached from "../../(auth)/components/MaxTryReached";
import api from "@/app/lib/api";

type Quiz = {
  _id: string;
  quizNumber: number;
  title: string;
  totalQuestions: number;
};

export default function QuizzesByCategoryPage() {
  /* ---------------- HOOKS ---------------- */

  const { categoryId } = useParams<{ categoryId: string }>();
  const router = useRouter();

  const { loading, isLogin, isGuest, isMaxTryReached } = useUser();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  /* ---------------- DATA FETCH ---------------- */

  useEffect(() => {
    if (loading || isMaxTryReached || (!isLogin && !isGuest) || !categoryId) {
      return;
    }

    const fetchQuizzes = async () => {
      try {
        const res = await api.get(
          `/categories/${categoryId}/quizzes`
        );
        setQuizzes(res.data.quizzes);
        console.log(quizzes)
       } catch (err) {
        console.error("❌ Failed to fetch quizzes", err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchQuizzes();
  }, [categoryId, loading, isLogin, isGuest, isMaxTryReached]);

  /* ---------------- GUARDS ---------------- */

  if (loading) return <Loading />;
  if (isMaxTryReached) return <MaxTryReached />;
  if (!isLogin && !isGuest) return <NotLoginComponent />;

  if (pageLoading) {
    return (
      <div className="min-h-[80dvh] flex items-center justify-center text-white gap-2">
        <Loading />
        Loading quizzes… 🧠⚡
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="min-h-[80dvh] flex flex-col items-center justify-center text-white gap-4">
        <p className="text-xl">No quizzes available 😴</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
        >
          Go back
        </button>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen px-4 py-12 flex flex-col items-center">
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl sm:text-4xl font-bold text-white mb-10 text-center"
      >
        Choose a Quiz 🧠🔥
      </motion.h1>

      {/* Quiz Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {quizzes.map((quiz, index) => (
          <motion.div
            key={quiz._id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href={`/quiz/${quiz._id}`}
              className="group block h-full bg-gray-800 rounded-xl p-6
                         shadow-lg hover:shadow-2xl
                         hover:bg-gray-700 transition-all text-white"
            >
              <div className="flex justify-between items-start h-full">
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">
                    Quiz #{quiz.quizNumber}
                  </p>

                  <h2 className="text-lg font-semibold group-hover:text-blue-400 transition">
                    {quiz.title}
                  </h2>

                  <p className="text-sm text-gray-400">
                    🎯 {quiz.totalQuestions} questions
                  </p>
                </div>

                <ArrowRightIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-400 transition" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
