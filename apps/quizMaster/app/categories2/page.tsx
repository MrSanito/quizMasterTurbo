"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import axios from "axios";

 import { useUser } from "../(auth)/context/GetUserContext";
 import Loading from "../Loading";
 import NotLoginComponent from "../(auth)/components/NotLoginComponent"
 import MaxTryReached from "../(auth)/components/MaxTryReached"
 
type Category = {
  _id: string;
  name: string;
  icon: string;
  quizzes: number;
};

export default function CategoriesPage() {
  /* ---------------- HOOKS (ALWAYS TOP) ---------------- */

  const { loading, isLogin, isGuest, isMaxTryReached } = useUser();

  const [categories, setCategories] = useState<Category[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // 🚫 Don’t fetch if auth blocks the page
    if (loading || isMaxTryReached || (!isLogin && !isGuest)) return;

    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories`
        );

        setCategories(res.data.categories);
      } catch (err) {
        console.error("❌ Failed to fetch categories", err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchCategories();
  }, [loading, isLogin, isGuest, isMaxTryReached]);

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
        Loading arenas… ⚔️
      </div>
    );
  }

  /* ---------------- PAGE UI ---------------- */

  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center px-4">
      {/* 🏷️ Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl sm:text-4xl font-bold text-white mb-10"
      >
        Choose Your Arena ⚔️
      </motion.h1>

      {/* 🧩 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl">
        {categories.map((category, index) => (
          <motion.div
            key={category._id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href={`/quizzes_new/${category._id}`}
              className="block rounded-xl p-5 text-white shadow-xl
                         bg-gradient-to-br from-indigo-500 to-purple-600"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{category.icon}</span>

                  <div>
                    <p className="text-xl font-semibold">{category.name}</p>
                    <p className="text-sm opacity-80">
                      {category.quizzes} quizzes
                    </p>
                  </div>
                </div>

                {/* ⬅️ THIS ICON IS 100% FINE (not the problem 😄) */}
                <ArrowRightIcon className="w-6 h-6 opacity-80" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
