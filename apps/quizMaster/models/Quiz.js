// /models/Quiz.js
import mongoose from "mongoose";
import Category from "./Category.js";

// Question Schema
const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  options: {
    type: [
      {
        text: { type: String, required: true },
        isCorrect: { type: Boolean, required: true, default: false },
      },
    ],
    validate: {
      validator: function (options) {
        return options.length === 4; // ✅ Exactly 4 options required
      },
      message: "Each question must have exactly 4 options.",
    },
  },
  points: {
    type: Number,
    required: true,
    default: 4, // ✅ +4 for correct answer
  },
  negativePoints: {
    type: Number,
    required: true,
    default: -1, // ❌ -1 for incorrect answer
  },
});

// Quiz Schema
const quizSchema = new mongoose.Schema({
  quizNumber: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    default: function () {
      return `Quiz ${this.quizNumber}`; // ✅ Auto-generate Quiz title
    },
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  questions: {
    type: [questionSchema],
    required: true,
  },
  totalPoints: {
    type: Number,
    default: function () {
      return this.questions.reduce((acc, question) => acc + question.points, 0);
    },
  },
  timeLimit: {
    type: Number,
    required: true,
    default: 10, // ⏳ Time limit in minutes
  },
});

// ✅ Auto-increment quiz number before saving
quizSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next();
  }
  const lastQuiz = await mongoose
    .model("Quiz")
    .findOne({}, {}, { sort: { quizNumber: -1 } });

  this.quizNumber = lastQuiz ? lastQuiz.quizNumber + 1 : 1;
  next();
});

// ✅ Post-save hook to update category quiz count dynamically
quizSchema.post("save", async function (doc) {
  const quizCount = await mongoose.model("Quiz").countDocuments({
    categoryId: doc.categoryId,
  });

  // ✅ Update quiz count in the respective category
  await Category.findByIdAndUpdate(doc.categoryId, { quizzes: quizCount });
});

// ✅ Export Quiz model
const Quiz = mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);

export default Quiz;
