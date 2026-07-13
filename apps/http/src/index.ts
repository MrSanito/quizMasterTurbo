// 1. LOAD ENV FIRST
import "dotenv/config";
console.log("DATABASE_URL =>", process.env.DATABASE_URL);

import express from "express";
import router from "./routes/index.js";
import cors from "cors";
import cookieparser from "cookie-parser";

// This points to the .env at the root of quizmasterturbo
console.log(" PID:", process.pid);

const app = express();
app.use(express.json()); //  too late
app.use(cookieparser());
app.set("trust proxy", true);

app.use((req, res, next) => {
  console.log(` Incoming Request: ${req.method} ${req.url}`);
  next();
});

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://quiz-master-turbo-quiz-master.vercel.app",
      "https://quiz-master-turbo-quiz-master.vercel.app/",
      "https://quizmaster.zynito.in",
      "http://quizmaster.zynito.in",
    ],
    credentials: true,
  }),
);


// all routes go through here
app.use("/api/v1", router);

const PORT = process.env.PORT || 3001;

app.get("/", async (req, res) => {
  res.json({
    success: true,
    message: "working fine on path /health",
  });
});
app.get("/test", (req, res) => {
  console.log({
    ip: req.ip,
    remoteAddress: req.socket.remoteAddress,
    xForwardedFor: req.headers["x-forwarded-for"],
    host: req.headers.host,
  });

  res.json({
    ip: req.ip,
    remoteAddress: req.socket.remoteAddress,
    xForwardedFor: req.headers["x-forwarded-for"],
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.stdin.resume();
