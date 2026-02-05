import { redis } from "./redis.service.js";

export async function joinRoom(roomId: string, player: any, socketId: string) {
  await redis.hset(
    `room:${roomId}:players`,
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
export async function leaveRoom(roomId: string, playerId: any, socketId: string) {
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
