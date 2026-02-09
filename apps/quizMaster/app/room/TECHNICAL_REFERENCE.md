# QuizMaster: Technical Event & API Reference

This document provides a complete map of all **WebSocket (WS)** and **HTTP API** interactions during the game lifecycle.

---

## 1. Lobby Phase
**Purpose**: Collect players and prepare for the game start.

### HTTP APIs
- **GET** `/api/room/:roomId`
  - *Returns*: Room details and metadata.

### WebSocket Events
- **ON** `lobby:join`
  - *Payload*: `{ roomId, player: { id, username, avatar } }`
  - *Action*: Adds player to `room:[id]:players` in Redis.
- **EMIT** `lobby:playerJoined` (Broadcast)
  - *Payload*: New player object.
- **EMIT** `lobby:sync` (Private)
  - *Payload*: List of current players in lobby for the joining user.

---

## 2. Initiation Phase ("The Bridge")
**Purpose**: Transition from lobby to active gameplay.

### HTTP APIs
- **POST** `/api/room/:roomId/start` (Host only)
  - *Actions*:
    1. Fetches all players from Redis -> Saves to Postgres `RoomPlayer`.
    2. Initializes `RoomQuestion` records in Postgres.
    3. Sets Redis state to `COUNTDOWN`.
    4. Clears old answer history from Redis.
- **EMIT** `lobby:startingRoom` (Broadcast)
  - *Action*: Triggers frontend redirection from `/lobby` to `/game`.

---

## 3. Play Phase
**Purpose**: The central game loop (Countdown, Questions, Answers).

### WebSocket Events
- **ON** `game:join`
  - *Action*: Re-joins the socket room.
- **EMIT** `game:sync` (Private)
  - *Payload*: `{ gameState, currentQuestion, timeLeft, startTime, myScore, questionIndex, totalQuestions }`
  - *Purpose*: Allows "Sync on Refresh" (Session Restoration).
- **EMIT** `game:countdown` (Broadcast)
  - *Payload*: `{ timeLeft: 5...1 }`
- **EMIT** `game:questionStart` (Broadcast)
  - *Payload*: `{ question: { text, options }, questionIndex, totalQuestions, timeLimit, startTime }`
  - *Note*: Correct options are STRIPPED on the server before emission.
- **ON** `game:submitAnswer`
  - *Payload*: `{ roomId, answer, timeTaken }`
  - *Action*: Validates against hidden correct answer in Redis. Updates score (+4/-1). Saves to Redis answer hash.
- **EMIT** `game:answerResult` (Private)
  - *Payload*: `{ isCorrect, points, newScore }`
- **EMIT** `game:scoreUpdate` (Broadcast)
  - *Payload*: `{ userId, score }`
  - *Purpose*: Real-time animation of avatars jumping/moving in the leaderboard.
- **EMIT** `game:questionEnd` (Broadcast)
  - *Payload*: `{ correctOptionId, leaderboard: Top5[] }`
  - *Purpose*: Shows correct answer highlight and intermediate rankings.

---

## 4. Finalization Phase
**Purpose**: End game and persist history.

### WebSocket Events
- **EMIT** `game:finished` (Broadcast)
  - *Payload*: `{ results: leaderboard[] }`
  - *Action*: Triggers redirection to `/result`.

### HTTP APIs (Internal/Sequential)
- **POST** `finalizeRoom` (Triggered by WS Service)
  - *Actions*:
    1. Pulls all scores from Redis -> Updates `RoomPlayer` scores in Postgres.
    2. Pulls every answer from `room:[id]:answers:*` -> Bulk inserts into `PlayerAnswer` table in Postgres.
    3. Cleans up Redis keys (expiry set to 1 hour).
    4. Sets Room State to `FINISHED`.

---

## 5. Result Phase
**Purpose**: Post-game analysis.

### HTTP APIs
- **GET** `/api/room/:roomId/result`
  - *Returns*: Aggregated history combining `RoomPlayer` (scores), `RoomQuestion` (metadata), and `PlayerAnswer` (user history).
