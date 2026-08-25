import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import apiRouter from "./routes/index.js";
import { logger } from "./utils/logger.js";

logger.info(`DATABASE_URL => ${process.env.DATABASE_URL}`);
logger.info(` PID: ${process.pid}`);

const app = new Hono();

// Global Logger Middleware
app.use("*", async (c, next) => {
	logger.info(` Incoming Request: ${c.req.method} ${c.req.url}`);
	await next();
});

// CORS Middleware
app.use(
	"/api/*",
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

// Router prefix /api/v1
app.route("/api/v1", apiRouter);

// Serve openapi.yaml
app.get("/openapi.yaml", async (c) => {
	try {
		const yamlPath = path.join(process.cwd(), "openapi.yaml");
		const content = await fs.readFile(yamlPath, "utf-8");
		return c.text(content, 200, { "Content-Type": "text/yaml" });
	} catch (_error) {
		return c.text("OpenAPI spec not found", 404);
	}
});

// Swagger UI Docs
app.get("/api/docs", (c) => {
	return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Swagger UI</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            url: '/openapi.yaml',
            dom_id: '#swagger-ui',
          });
        };
      </script>
    </body>
    </html>
  `);
});

// Health Checks & Tests
app.get("/", (c) => {
	return c.json(
		{
			success: true,
			message: "working fine on path /health",
		},
		200,
	);
});

app.get("/test", (c) => {
	const xForwardedFor = c.req.header("x-forwarded-for");
	const host = c.req.header("host");

	logger.info({
		xForwardedFor,
		host,
	});

	return c.json(
		{
			xForwardedFor,
		},
		200,
	);
});

// Global Error Handler
app.onError((err, c) => {
	logger.error(err, "--------- this is the error");
	return c.json(
		{
			success: false,
			message: err.message,
		},
		500,
	);
});

const PORT = Number(process.env.PORT || 3001);

serve(
	{
		fetch: app.fetch,
		port: PORT,
	},
	() => {
		logger.info(`Server running on http://localhost:${PORT}`);
	},
);
