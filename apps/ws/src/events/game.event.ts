import { GameEngine } from "../core/GameEngine.js";
import type { JoinRoomPayload } from "../types/socket.types.js";

export function gameEvents(io: any, socket: any) {
	// 1. JOIN GAME (Reconnect or New Sync)
	socket.on("game:join", async ({ roomId, player }: JoinRoomPayload) => {
		if (!roomId) return;
		socket.join(roomId);

		// Store user info on socket
		const playerId = player?.id || socket.data?.playerId;
		if (!playerId) return;

		socket.data.roomId = roomId;
		socket.data.playerId = playerId;

		// Ensure player is registered in room:players and marked connected
		await GameEngine.getInstance().joinRoom(roomId, playerId, socket.id, {
			name: player?.name,
			avatar: player?.avatar,
		});

		// Fetch synchronized state from authoritative GameEngine
		const syncState = await GameEngine.getInstance().getSyncPayload(roomId, playerId);

		// Emit private sync event to client
		socket.emit("game:sync", syncState);
	});

	// 2. START GAME (Host triggers)
	socket.on("game:start", async ({ roomId }: any) => {
		if (!roomId) return;
		await GameEngine.getInstance().startGame(roomId);
	});

	// 3. SUBMIT ANSWER (Atomic Lua execution)
	socket.on(
		"game:submitAnswer",
		async (data: { roomId: string; answer: string; timeTaken: number }) => {
			const pId = socket.data.playerId;
			if (!data?.roomId || !pId) return;

			try {
				const result = await GameEngine.getInstance().submitAnswer(
					data.roomId,
					pId,
					data.answer,
					data.timeTaken || 0,
				);

				console.log(`[GameEvent] submitAnswer result for ${pId}:`, result);
				if (result.error) {
					socket.emit("error", { message: result.message || result.error });
					return;
				}

				// Emit result to this submitting user
				socket.emit("game:answerResult", result);
			} catch (e: any) {
				console.error("Submit answer error:", e);
				socket.emit("error", { message: e.message || "Failed to submit answer" });
			}
		},
	);
}
