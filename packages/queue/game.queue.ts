import { redisConnection } from "@repo/redis";
import { Queue } from "bullmq";

export const gameCleanupQueue = new Queue("game-cleanup", {
	connection: redisConnection,
});
