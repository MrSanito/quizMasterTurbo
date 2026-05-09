import { Queue } from "bullmq";
import { redisConnection } from "@repo/redis";

export const gameCleanupQueue = new Queue("game-cleanup", {
  connection: redisConnection,
});
