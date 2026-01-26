import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // required for Bull / sockets
  enableReadyCheck: false, // faster boot in serverless
  lazyConnect: true, // don't connect until used
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
});


redis.on("connect", () => {
  console.log("🧠 Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error", err);
});

process.on("SIGINT", async () => {
  await redis.quit();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await redis.quit();
  process.exit(0);
});


export const redisClient = redis;
export default redis;
