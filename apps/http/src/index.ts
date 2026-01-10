// 1. LOAD ENV FIRST
import dotenv from "dotenv";
import path from "path";
dotenv.config();
console.log(process.env.DATABASE_URL);

import express from "express";
import router from "./routes/index.js";
import cors from "cors";
import cookieparser from "cookie-parser";

// This points to the .env at the root of quizmasterturbo
console.log("🔥 PID:", process.pid);

const app = express();
app.use(express.json()); // ❌ too late

app.use((req, res, next) => {
  console.log(`🔔 Incoming Request: ${req.method} ${req.url}`);
  next();
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(cookieparser());

// all routes go through here
app.use("/api/v1", router);

const PORT = process.env.PORT || 3001;

app.get("/", async (req, res) => {
  res.json({
    success: true,
    message: "working fine on path /",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.stdin.resume();
