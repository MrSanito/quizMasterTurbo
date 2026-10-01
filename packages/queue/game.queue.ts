import { redisConnection } from "@repo/redis";
import { Queue } from "bullmq";

export const gameEventsQueue = new Queue("game-events", {
	connection: redisConnection,
});

export const gameCleanupQueue = new Queue("game-cleanup", {
	connection: redisConnection,
});
