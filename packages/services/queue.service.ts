import { gameCleanupQueue } from "@repo/queue";

export async function addGameCleanupJob(roomId: string) {
  await gameCleanupQueue.add(
    "finalize-room",
    { roomId },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: true,
    },
  );
}
