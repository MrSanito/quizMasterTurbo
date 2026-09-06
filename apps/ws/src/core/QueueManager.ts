import { addGameFinishedJob, gameQueue } from "../services/queue.service.js";

export class QueueManager {
	private static instance: QueueManager | null = null;

	private constructor() {}

	public static getInstance(): QueueManager {
		if (!QueueManager.instance) {
			QueueManager.instance = new QueueManager();
		}
		return QueueManager.instance;
	}

	/**
	 * Adds a game-finished job to the queue for background worker processing
	 */
	public async addGameFinishedJob(roomId: string): Promise<any> {
		console.log(`[QueueManager] Dispatching game-finished job for room: ${roomId}`);
		try {
			return await addGameFinishedJob(roomId);
		} catch (error) {
			console.error(
				`[QueueManager] Failed to dispatch game-finished job for room ${roomId}:`,
				error,
			);
			// Fallback direct queue add if needed
			return await gameQueue.add(
				"game-finished",
				{ roomId },
				{
					attempts: 3,
					backoff: { type: "exponential", delay: 1000 },
				},
			);
		}
	}
}

export default QueueManager;
