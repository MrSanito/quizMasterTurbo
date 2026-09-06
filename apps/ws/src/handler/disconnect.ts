import { GameEngine } from "../core/GameEngine.js";
import { RedisManager } from "../core/RedisManager.js";

export async function handleDisconnect(io: any, socket: any) {
	let roomId = socket.data?.roomId;
	let playerId = socket.data?.playerId;

	// Fallback to Redis reverse lookup if socket.data is empty
	if (!roomId || !playerId) {
		const meta = await RedisManager.getInstance().getHash(`socket:${socket.id}:meta`);
		if (meta?.roomId) roomId = meta.roomId;
		if (meta?.userId) playerId = meta.userId;
	}

	console.log(`🔌 [DisconnectHandler] Socket ${socket.id} disconnected (Room: ${roomId}, Player: ${playerId})`);

	if (!roomId || !playerId) return;

	await GameEngine.getInstance().handleDisconnect(roomId, playerId, socket.id);
}
