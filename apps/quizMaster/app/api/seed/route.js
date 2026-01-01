import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Category from "@/models/Category";

// 🎯 POST API to seed categories
export async function POST() {
  try {
    // ✅ Connect to DB
    await connectToDatabase();

    // ✅ Define initial categories
    const initialCategories = [
      {
        name: "Geography",
        icon: "🌐",
        quizzes: 3,
      },
      {
        name: "Science",
        icon: "⚗️",
        quizzes: 2,
      },
      {
        name: "Movies & TV",
        icon: "🎥",
        quizzes: 2,
      },
      {
        name: "Music",
        icon: "🎵",
        quizzes: 2,
      },
      {
        name: "History",
        icon: "📚",
        quizzes: 2,
      },
      {
        name: "Sports",
        icon: "⚽",
        quizzes: 2,
      },
    ];

    // ✅ Clear existing categories
    await Category.deleteMany({});

    // ✅ Insert new categories
    const categories = await Category.insertMany(initialCategories);

    // ✅ Return success message
    return NextResponse.json({
      message: "Categories seeded successfully",
      count: categories.length,
    });
  } catch (error) {
    console.error("❌ Error seeding categories:", error.message);
    return NextResponse.json(
      { message: "Error seeding categories" },
      { status: 500 }
    );
  }
}
