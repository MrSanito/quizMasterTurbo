import Redis from "ioredis";

let redisInstance: Redis | null = null;

if (!redisInstance) {
	redisInstance = new Redis(process.env.REDIS_URL!, {
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
	await redisInstance!.quit();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	await redisInstance!.quit();
	process.exit(0);
});

export const redisClient = redisInstance;
export default redisInstance;
