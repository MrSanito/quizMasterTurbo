import { GameEngine } from "../core/GameEngine.js";
import type { JoinRoomPayload } from "../types/socket.types.js";

export function lobbyEvents(io: any, socket: any) {
	socket.on("lobby:join", async ({ roomId, player }: JoinRoomPayload) => {
		if (!roomId || !player?.id) return;

		// Save data on socket
		socket.data.roomId = roomId;
		socket.data.playerId = player.id;

		socket.join(roomId);

		await GameEngine.getInstance().joinRoom(roomId, player.id, socket.id, {
			name: player.name,
			avatar: player.avatar,
		});
	});

	socket.on("lobby:leave", async ({ roomId, player }: JoinRoomPayload) => {
		if (!roomId) return;
		const playerId = player?.id || socket.data?.playerId;
		if (!playerId) return;

		socket.leave(roomId);
		await GameEngine.getInstance().leaveRoom(roomId, playerId, socket.id);
	});

	socket.on("lobby:letsstart", async ({ roomId }: any) => {
		if (!roomId) return;

		const hostId = await GameEngine.getInstance().getHostId(roomId);
		const isHost = hostId ? hostId === socket.data?.playerId : true;

		if (!isHost) {
			socket.emit("lobby:error", {
				message: "You are not authorized to start the game",
			});
			return;
		}

		console.log(`[LobbyEvent] Host ${socket.data?.playerId} triggered start for room ${roomId}`);
		await GameEngine.getInstance().startGame(roomId);
	});
}
