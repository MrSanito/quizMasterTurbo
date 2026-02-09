# 🎮 QuizMaster: Game Engine Deep Dive (Complete Version)

This guide provides an exhaustive breakdown of the QuizMaster engine logic. If you are learning how to build real-time multiplayer games, this is your roadmap.

---

## 1. High-Level Architecture

QuizMaster follows a **Hybrid Reality** model. The server is the absolute source of truth, but the client predicts and synchronizes state to feel instant.

- **PostgreSQL**: Stores persistent users, quizzes, and historical results.
- **Redis**: Stores volatile game state (scores, timers, answers).
- **React (Next.js)**: The presentation layer that reconciles local state with server events.

---

## 2. Phase 1: The Transition (Lobby → Game)

### A. The Start Trigger
When the host clicks "Start", the backend `startRoom` controller performs a "Database Migration":
1. **Sync Players**: It pulls everyone from the Redis Lobby and bulk-inserts them into the Postgres `RoomPlayer` table. This ensures they are "officially" in the game records.
2. **Setup Results**: It creates `RoomQuestion` records. Think of these as empty boxes waiting to be filled with player answers.
3. **Bridge Emit**: It sends a `lobby:startingRoom` socket event.

### B. Client-Side Routing
The frontend `page.tsx` in the lobby listens for `startingRoom`. When it fires:
```typescript
socket.on("lobby:startingRoom", () => {
    router.replace(`/room/${roomId}/game`);
});
```
Using `router.replace` is critical so that the "Back" button doesn't take the user back to the lobby once the game has started.

---

## 3. Phase 2: Game Page Logic & Synchronization

This is the most complex part of the app. It must handle late-joiners, refreshes, and lag.

### A. The `game:join` State Recovery
When a player lands on `/game`, the component initializes. It immediately calls `game:join`.
The server responds with a `game:sync` payload:
```json
{
  "gameState": "PLAYING",
  "currentQuestion": { "text": "...", "options": [...] },
  "timeLeft": 9,
  "startTime": 1707470000000,
  "myScore": 12,
  "questionIndex": 2,
  "userAnswer": "Option A"
}
```
If the user refreshed their browser, this payload restores their score and re-highlights their previous answer.

### B. The Synchronized Timer (The "Secret Sauce")
We never rely on `setInterval(15)` on the client. Why? Because User A might load the page 2 seconds slower than User B.

**The Solution**:
1. Server sends a `startTime` (unix timestamp).
2. Frontend calculates the offset locally:
```typescript
const elapsed = (Date.now() - startTime) / 1000;
const remaining = Math.max(0, Math.ceil(initialTimeLeft - elapsed));
```
By basing the countdown on a **shared timestamp**, every player's screen flashes "Time's Up!" at the exact same moment.

---

## 4. Phase 3: The Event Lifecycle (Start → End)

### Event 1: `game:questionStart`
**Trigger**: Every 20 seconds from the server loop.
**UI Action**: 
- Resets "isAnswered" state.
- Highlights the new question.
- Starts the 15-second countdown.

### Event 2: `game:submitAnswer`
**Trigger**: User clicks an option.
**Logic**: 
- Frontend immediately locks the buttons (`isAnswered = true`).
- Server validates text in Redis.
- Server returns `game:answerResult` (Direct Score Update).

### Event 3: `game:scoreUpdate`
**Trigger**: Any player in the room answers correctly.
**UI Action**: 
- The leaderboard updates.
- In a "Premium" UI, this is where you trigger **Avatar Jump animations**. Seeing other players' scores move live creates a sense of competition.

### Event 4: `game:questionEnd`
**Trigger**: After 15 seconds.
**Logic**: 
- Server reveals the correct answer.
- Server sends the **Top 5 Leaderboard**.
- Frontend shows a green/red highlight on the options.

---

## 5. Phase 4: Finalization & Database Persistence

When the last question is finished, the WebSocket service calls the `finalizeRoom` HTTP endpoint internally.

### Why move from Redis to Postgres?
Redis is fast but "volatile" (data can be lost if server restarts). Postgres is "durable".
1. **Bulk Save**: The server gathers all answers from Redis hashes: `room:id:answers:0`, `room:id:answers:1`, etc.
2. **Relational Link**: It saves them to the `PlayerAnswer` table, linking each answer to a `RoomQuestion` ID and a `UserId`.
3. **Finish Signal**: Emits `game:finished`.

### Final Redirect
The `GamePage.tsx` sees the `FINISHED` state:
```typescript
useEffect(() => {
    if (gameState === "FINISHED") {
        setTimeout(() => router.replace(`/result`), 3000);
    }
}, [gameState]);
```
The 3-second delay allows the user to see their final rank on the leaderboard before being whisked away to the detailed analysis page.

---

## 🛠️ Where to look in the Code?
- **Timer Sync**: `apps/quizMaster/components/RealTimeQuizPlayer.tsx` -> Look at the `useEffect` that uses `startTime`.
- **Fast Scoring**: `apps/ws/src/services/game.service.ts` -> Look at `submitAnswer`.
- **Bulk Save**: `apps/http/src/controllers/room.controller.ts` -> Look at `finalizeRoom`.
- **Result Logic**: `apps/http/src/controllers/room.controller.ts` -> Look at `getRoomResult`.
