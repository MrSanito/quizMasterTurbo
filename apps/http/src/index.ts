// 1. LOAD ENV FIRST
import "dotenv/config";
import { logger } from "./utils/logger.js";

logger.info(`DATABASE_URL => ${process.env.DATABASE_URL}`);

import path from "node:path";
import cookieparser from "cookie-parser";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import router from "./routes/index.js";

// Load OpenAPI spec
const swaggerDocument = YAML.load(path.join(process.cwd(), "openapi.yaml"));

// This points to the .env at the root of quizmasterturbo
logger.info(` PID: ${process.pid}`);

const app = express();
app.use(express.json()); //  too late
app.use(cookieparser());
app.set("trust proxy", true);

app.use((req, _res, next) => {
	logger.info(` Incoming Request: ${req.method} ${req.url}`);
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

// swagger ui docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 3001;

app.get("/", async (_req, res) => {
	res.json({
		success: true,
		message: "working fine on path /health",
	});
});
app.get("/test", (req, res) => {
	logger.info({
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
	logger.info(`Server running on http://localhost:${PORT}`);
});

process.stdin.resume();
