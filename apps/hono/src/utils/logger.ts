import pino from "pino";

const isCloudflare = typeof (globalThis as any).caches !== "undefined";

export const logger = pino({
	level: process.env.NODE_ENV === "production" ? "info" : "debug",
	transport:
		!isCloudflare && process.env.NODE_ENV !== "production"
			? {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "SYS:standard",
						ignore: "pid,hostname",
					},
				}
			: undefined,
});
