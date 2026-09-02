import Redis from "ioredis";

const redisInstance = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
	maxRetriesPerRequest: null, // required for Bull / sockets
	enableReadyCheck: false, // faster boot in serverless
	lazyConnect: true, // don't connect until used
	retryStrategy(times) {
		return Math.min(times * 50, 2000);
	},
});

redisInstance.on("connect", () => {
	console.log(" Redis connected");
});

redisInstance.on("error", (err) => {
	console.error("Redis error", err);
});

process.on("SIGINT", async () => {
	await redisInstance.quit();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	await redisInstance.quit();
	process.exit(0);
});

export const redisConnection = redisInstance;
export const redisClient = redisInstance;
export default redisInstance;

