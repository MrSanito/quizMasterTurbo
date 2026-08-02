"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import api from "@/app/lib/api";

/* ================= TYPES ================= */

type QuizHistoryItem = {
  id: string;
  score: number;
  total: number;
  timeTaken: number;
  createdAt: string;
  quiz: {
    id: string;
    title: string;
    categoryId: string;
  };
};

type QuizPlayerHistoryProps = {
  viewerId?: string;
  viewerType?: "user" | "guest";
};

/* ================= COMPONENT ================= */

export default function QuizPlayerHistory({
  viewerId,
  viewerType,
}: QuizPlayerHistoryProps) {
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    //  HARD GUARD (THIS MATTERS)
    if (!viewerId || !viewerType) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await api.get(
          `/quizzes/history`,
          {
            params: { viewerId, viewerType },
            withCredentials: true,
          }
        );

        console.log("HISTORY RESPONSE ", res);

        const payload = res.data;

        if (!payload || !Array.isArray(payload.attempts)) {
          console.error("BAD SHAPE ", payload);
          throw new Error("Invalid history response");
        }

        const attempts = payload.attempts;


        //  Normalize Prisma casing (Quiz -> quiz)
        const normalized: QuizHistoryItem[] = attempts.map((a: any) => ({
          id: a.id,
          score: a.score,
          total: a.total,
          timeTaken: a.timeTaken,
          createdAt: a.createdAt,
          quiz: {
            id: a.Quiz.id,
            title: a.Quiz.title,
            categoryId: a.Quiz.categoryId,
          },
        }));

        setHistory(normalized);
      } catch (err) {
        console.error(" Failed to load quiz history", err);
        setError("Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [viewerId, viewerType]);

  /* ================= STATES ================= */

  if (loading) {
    return (
      <div className="mt-10 text-center text-white/70">
        Loading your quiz history... 
      </div>
    );
  }

  if (error) {
    return <div className="mt-10 text-center text-red-200 font-medium">{error}</div>;
  }

  if (history.length === 0) {
    return (
      <div className="mt-10 text-center text-white/70">
        You haven't played any quizzes yet 
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="max-w-7xl mx-auto mt-12">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-white">
         Your Quiz History
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {history.map((item, index) => {
          const percent =
            item.total > 0 ? Math.round((item.score / item.total) * 100) : 0;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.03 }}
              className="rounded-2xl p-5 bg-white shadow-lg border border-gray-100"
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{item.quiz.title}</h3>

                  <p className="text-sm text-gray-500 mt-1">
                    Score: {item.score} / {item.total} ({percent}%)
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                     {item.timeTaken}s {" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <Link
                  href={`/quiz/${item.quiz.categoryId}/result/${item.id}`}
                  className="text-[#7047C7] hover:text-[#5B32B4] transition"
                >
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
              </div>

              <div className="mt-4 h-2 w-full bg-gray-100 rounded">
                <div
                  className={`h-2 rounded ${
                    percent >= 60
                      ? "bg-emerald-500"
                      : percent >= 40
                        ? "bg-amber-400"
                        : "bg-red-400"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}