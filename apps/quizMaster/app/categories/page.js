"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import Loading from "../Loading";

// 🎯 Main Categories Page
export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Use a relative URL instead of an absolute one
        const response = await fetch("/api/categories");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Categories data:", data);
        setCategories(data.categories ?? data); // supports both shapes
      } catch (error) {
        console.error("❌ Error fetching categories:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center  p-4">
      <h1 className="text-3xl font-bold text-white mb-6">Play by Category</h1>

      {/* ✅ No categories available fallback */}
      {categories.length === 0 ? (
        <p className="text-white">No categories available.</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-4 w-full max-w-4xl">
          {categories.map((category) => (
            <Link
              key={category._id}
              href={`/quizzes/${category._id}`}
              className="flex items-center justify-between w-full sm:w-[280px] bg-gray-800 p-4 rounded-lg shadow-lg text-white hover:bg-gray-700 hover:scale-105 transition-all"
            >
              <div className="flex items-center space-x-4">
                {/* 📚 Category Icon with fallback */}
                <span className="text-3xl">{category.icon || "📚"}</span>

                <div>
                  <p className="text-lg font-semibold">{category.name}</p>
                  <p className="text-sm text-gray-400">
                    {category.quizzes?.length || 0} quizzes
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
