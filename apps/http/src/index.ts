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

import fs from "node:fs";

// Load OpenAPI spec with fallback paths to support both local dev and production/monorepo start directories
let swaggerDocument: any;
const possiblePaths = [
	path.join(process.cwd(), "openapi.yaml"),
	path.join(process.cwd(), "apps/http/openapi.yaml"),
	path.join(__dirname, "../../../", "openapi.yaml")
];

for (const p of possiblePaths) {
	try {
		if (fs.existsSync(p)) {
			swaggerDocument = YAML.load(p);
			logger.info(`Loaded OpenAPI spec from: ${p}`);
			break;
		}
	} catch (err) {
		logger.error(err, `Error checking or loading OpenAPI spec from: ${p}`);
	}
}

if (!swaggerDocument) {
	logger.warn("Could not locate or load openapi.yaml from any expected paths.");
}

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
if (swaggerDocument) {
	app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

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
