import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb"; // ✅ Correct import
import Category from "@/models/Category";

// 🎯 GET API to fetch categories
export async function GET() {
  try {
    // ✅ Connect to DB
    await connectToDatabase();

    // ✅ Fetch categories from DB
    const categories = await Category.find({});
    console.log(categories)

    // ✅ Return categories in JSON
    return NextResponse.json(categories);
  } catch (error) {
    console.error("❌ Error fetching categories:", error.message);
    return NextResponse.json(
      { message: "Error fetching categories" },
      { status: 500 }
    );
  }
}
