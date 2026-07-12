import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { redisClient } from '@repo/redis'; // keep for legacy if needed

// NOTE: BullMQ needs a connection OBJECT, not an instance, OR we reuse the connection.
// Best practice: verify @repo/redis exports connection options.

// Create Redis instance
const connection = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, { 
      maxRetriesPerRequest: null, 
      enableReadyCheck: false,
      family: 4 
    })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: (process.env.REDIS_PASSWORD || undefined) as string | undefined,
      maxRetriesPerRequest: null, 
      enableReadyCheck: false,
      family: 4
    } as any);


export const gameQueue = new Queue('game-events', { connection: connection as any });

export const addGameFinishedJob = async (roomId: string) => {
    console.log(`[QueueService]  Adding game-finished job for room ${roomId}`);
    try {
        const job = await gameQueue.add('game-finished', { roomId }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 }
        });
        console.log(`[QueueService]  Job added successfully! Job ID: ${job.id}`);
        return job;
    } catch (error) {
        console.error(`[QueueService]  Failed to add job for room ${roomId}`, error);
        throw error;
    }
};

gameQueue.on('error', (err) => {
    console.error('[QueueService] Queue Error:', err);
});

console.log(`[QueueService] Initialized gameQueue with connection to ${process.env.REDIS_HOST || 'localhost'}`);
