"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import axios from "axios";

import { useUser } from "../(auth)/context/GetUserContext";
import Loading from "@/components/Loading";
import NotLoginComponent from "../(auth)/components/NotLoginComponent";
import MaxTryReached from "../(auth)/components/MaxTryReached";
import api from "../lib/api";

type Category = {
  _id: string;
  name: string;
  icon?: string;
  quizzes: number;
};

export default function CategoriesPage() {
  /* ---------------- HOOKS ---------------- */

  const { loading, isLogin, isGuest, isMaxTryReached } = useUser();

  const [categories, setCategories] = useState<Category[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (loading || isMaxTryReached || (!isLogin && !isGuest)) return;

    const fetchCategories = async () => {
      try {
        const res = await api.get(
          `/categories`
        );

        setCategories(res.data.categories ?? res.data);
      } catch (err) {
        console.error("❌ Failed to fetch categories", err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchCategories();
  }, [loading, isLogin, isGuest, isMaxTryReached]);

  /* ---------------- GUARDS ---------------- */

  if (loading) {
    return <Loading />;
  }

  if (isMaxTryReached) {
    return <MaxTryReached />;
  }

  if (!isLogin && !isGuest) {
    return <NotLoginComponent />;
  }

  if (pageLoading) {
    return <Loading />;
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-white mb-6">
        Play by Category 🎯
      </h1>

      {/* Empty state */}
      {categories.length === 0 ? (
        <p className="text-white">No categories available.</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-4 w-full max-w-4xl">
          {categories.map((category) => (
            <Link
              key={category._id}
              href={`/quizzes/${category._id}`}
              className="flex items-center justify-between
                         w-full sm:w-[280px]
                         bg-gray-800 p-4 rounded-lg shadow-lg
                         text-white
                         hover:bg-gray-700 hover:scale-105
                         transition-all"
            >
              <div className="flex items-center space-x-4">
                {/* Icon */}
                <span className="text-3xl">{category.icon || "📚"}</span>

                <div>
                  <p className="text-lg font-semibold">{category.name}</p>
                  <p className="text-sm text-gray-400">
                    {category.quizzes || 0} quizzes
                  </p>
                </div>
              </div>

              <ArrowRightIcon className="w-6 h-6 text-white ml-4" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
