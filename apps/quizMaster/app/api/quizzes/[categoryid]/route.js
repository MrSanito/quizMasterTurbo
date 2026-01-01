// /app/api/quizzes/[categoryid]/route.js
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Quiz from "@/models/Quiz";
import mongoose from "mongoose";

// 🎯 GET quizzes for the selected category
export async function GET(req, { params }) {
  const { categoryid } = await params;

  try {
    // ✅ Connect to MongoDB using Mongoose
    await connectToDatabase();
    console.log("✅ DB Connected");

    // ✅ Check if categoryid is a valid ObjectId
    const isValidId = mongoose.Types.ObjectId.isValid(categoryid);
    const query = isValidId
      ? { categoryId: new mongoose.Types.ObjectId(categoryid) }
      : { categoryId: categoryid };

    // ✅ Fetch quizzes using Mongoose
    const quizzes = await Quiz.find(query);

    // ⚠️ Handle no data found
    if (!quizzes || quizzes.length === 0) {
      return NextResponse.json(
        { message: "No quizzes found" },
        { status: 404 }
      );
    }

    // ✅ Return quizzes as JSON
    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("❌ Error fetching quizzes:", error.message);
    return NextResponse.json(
      { message: "Error fetching quizzes" },
      { status: 500 }
    );
  }
}
