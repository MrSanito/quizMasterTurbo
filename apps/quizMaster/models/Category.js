// /models/Category.js
import mongoose from "mongoose";

// Category Schema
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  quizzes: {
    type: Number,
    required: true,
    default: 0, // ✅ Initial quiz count is 0
  },
});

// ✅ Export Category model
const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);

export default Category;
