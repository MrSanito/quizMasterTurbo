// /app/api/get-quiz/[quizId]/route.js
import connectToDatabase from "@/lib/mongodb";
import Quiz from "@/models/Quiz";

export async function GET(req, { params }) {
  await connectToDatabase();
  const { quizId } = params;

  try {
    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) return Response.json({ quiz: null }, { status: 404 });

    return Response.json({ quiz });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
