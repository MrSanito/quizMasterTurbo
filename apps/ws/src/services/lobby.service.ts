import { redis } from "./redis.service.js";

export async function joinLobby(roomId: string, player: any, socketId: string) {
  const key = `room:${roomId}:players`;
  console.log(`📝 [LobbyService] Writing player ${player.id} to Redis Key: ${key}`);
  await redis.hset(
    key,
    player.id,
    JSON.stringify({
      username: player.name,
      avatar: player.avatar,
      socketId,
      score: 0,
    }),
  );

  return await redis.hgetall(`room:${roomId}:players`);
}
export async function leaveLobby(roomId: string, playerId: any, socketId: string) {
  console.log("deleted the player and sending data")
const deleted = await redis.hdel(`room:${roomId}:players`, playerId);
console.log(deleted)

  return await redis.hgetall(`room:${roomId}:players`);
}

export async function removePlayerBySocket(socketId: string) {
  const keys = await redis.keys("room:*:players");

  for (const key of keys) {
    const players: any = await redis.hgetall(key);

    for (const userId in players) {
      const data = JSON.parse(players[userId]);
      if (data.socketId === socketId) {
        await redis.hdel(key, userId);
      }
    }
  }
}
