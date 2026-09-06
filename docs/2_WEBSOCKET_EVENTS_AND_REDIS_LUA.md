# 02. WebSocket Events & Redis Lua Engine

This document details the Socket.IO communication protocols, Redis data models, and atomic grading logic via Lua scripts.

---

## 📡 1. Complete Socket.IO Event Reference

All socket traffic runs over `/socket.io/` with JWT authentication middleware.

### A. Lobby Events (`apps/ws/src/events/lobby.event.ts`)

| Event Name | Direction | Payload Example | Purpose |
| :--- | :--- | :--- | :--- |
| `lobby:join` | Client ➔ Server | `{ roomId: "room_1", player: { id: "u1", name: "Alice", avatar: "a1.svg" } }` | Joins room lobby and registers player in Redis. |
| `lobby:leave` | Client ➔ Server | `{ roomId: "room_1", player: { id: "u1" } }` | Voluntarily leaves room lobby. |
| `lobby:letsstart` | Client ➔ Server | `{ roomId: "room_1" }` | Host starts the countdown and initializes question loop. |
| `lobby:players` | Server ➔ Room | `[{ id: "u1", name: "Alice", avatar: "a1.svg", connected: true, score: 0 }]` | Broadcasts full player roster upon join/leave/disconnect. |
| `lobby:playerJoined` | Server ➔ Room | `{ userId: "u1", name: "Alice", avatar: "a1.svg", timestamp: 1707470000000 }` | Toast activity banner notification. |
| `lobby:playerLeft` | Server ➔ Room | `{ userId: "u1", name: "Alice", avatar: "a1.svg", timestamp: 1707470000000 }` | Toast activity banner notification. |
| `lobby:startingRoom`| Server ➔ Room | `{ countdown: 5, startTime: 1707470005000, message: "Game starting..." }` | Signals client to navigate to `/room/[roomId]/game`. |
| `lobby:hostDisconnected` | Server ➔ Room | `{ gracePeriod: 30000, seconds: 30, message: "Host disconnected..." }` | Warns room of host dropout and starts 30s timer. |
| `lobby:hostCountdown` | Server ➔ Room | `{ seconds: 28 }` | 1-second ticks for host grace countdown banner. |
| `lobby:hostReconnected` | Server ➔ Room | `{}` | Cancels host grace period when host rejoins. |
| `lobby:aborted` | Server ➔ Room | `{ reason: "HOST_LEFT", message: "Room closed" }` | Emitted when room is terminated. |

---

### B. Gameplay Events (`apps/ws/src/events/game.event.ts`)

| Event Name | Direction | Payload Example | Purpose |
| :--- | :--- | :--- | :--- |
| `game:join` | Client ➔ Server | `{ roomId: "room_1", player: { id: "u1" } }` | Emitted upon mounting game page or re-connecting. |
| `game:sync` | Server ➔ Client | `{ gameState: "PLAYING", myScore: 8, currentQuestion: {...}, timeLeft: 9, alreadyAnswered: false, userAnswer: null, leaderboard: [...] }` | Direct response to `game:join` for full state recovery. |
| `game:questionStart` | Server ➔ Room | `{ question: { id: "q1", text: "What is 2+2?", options: ["3","4","5","6"] }, questionIndex: 0, totalQuestions: 5, timeLimit: 15, startTime: 1707470000000 }` | Starts 15s round with sanitized question and shared timestamp. |
| `game:submitAnswer` | Client ➔ Server | `{ roomId: "room_1", answer: "4", timeTaken: 3420 }` | Submits selected answer for atomic evaluation. |
| `game:answerResult` | Server ➔ Client | `{ success: true, isCorrect: true, correctOptionText: "4", points: 4, newScore: 12 }` | Direct private grading result for immediate button feedback. |
| `game:playerAnswered`| Server ➔ Room | `{ userId: "u1" }` | Live indicator that a player locked their answer. |
| `game:scoreUpdate` | Server ➔ Room | `{ userId: "u1", score: 12, name: "Alice" }` | Broadcasts new score live for leaderboard movement. |
| `game:questionEnd` | Server ➔ Room | `{ correctOptionId: "4", correctAnswer: "4", leaderboard: [...] }` | Reveals correct answer and Top 5 leaderboard. Starts 5s break. |
| `game:finished` | Server ➔ Room | `{ results: [{ userId: "u1", name: "Alice", score: 20, rank: 1 }, ...] }` | Displays final podium summary. Dispatches persistence job. |

---

## 🗄 2. Redis Data Structures & Key Partitioning

All ephemeral data is organized under Redis keys prefixed with `room:<roomId>`:

```
room:{roomId}                      -> Hash (metadata: hostId, quizId, createdAt, state)
room:{roomId}:state                -> Hash (status, currentQuestionIndex, questionStartTime, totalQuestions)
room:{roomId}:players              -> Hash { [userId]: JSON(PlayerData) }
room:{roomId}:scores               -> Hash { [userId]: integerScore }
room:{roomId}:questions            -> List [ JSON(RawQuestion0), JSON(RawQuestion1), ... ]
room:{roomId}:order:{qIndex}       -> String (JSON array of deterministic shuffled option strings)
room:{roomId}:answers:{qIndex}     -> Hash { [userId]: submittedAnswerText }
room:{roomId}:answers_meta:{qIndex}-> Hash { [userId]: responseTimeMs }
room:{roomId}:loop_lock            -> String (Distributed Mutex with 15s TTL)
socket:{socketId}:meta             -> Hash { roomId, userId } (Reverse lookup on disconnect)
```

---

## ⚡ 3. Atomic Answer Grading (`submit_answer.lua`)

To eliminate race conditions (such as double-clicking, answering twice, or answering after the 15-second timer has elapsed), scoring logic is executed atomically in Redis via Lua:

```lua
-- submit_answer.lua
local stateKey = KEYS[1]
local scoresKey = KEYS[2]
local answersKey = KEYS[3]
local metaKey = KEYS[4]

local userId = ARGV[1]
local submittedAnswer = ARGV[2]
local correctAnswer = ARGV[3]
local timeTaken = ARGV[4]
local correctPoints = tonumber(ARGV[5]) or 4
local incorrectPoints = tonumber(ARGV[6]) or -1
local expectedQIndex = ARGV[7]

-- 1. Check if room is in PLAYING state
local status = redis.call('HGET', stateKey, 'status')
if not status or status ~= 'PLAYING' then
    return cjson.encode({ error = 'NOT_PLAYING', message = 'Game is not in PLAYING state' })
end

-- 2. Verify question index (reject late submissions)
if expectedQIndex and expectedQIndex ~= '' then
    local currentQIndex = redis.call('HGET', stateKey, 'currentQuestionIndex')
    if currentQIndex and tostring(currentQIndex) ~= tostring(expectedQIndex) then
        return cjson.encode({ error = 'QUESTION_CLOSED', message = 'Question has already concluded' })
    end
end

-- 3. Prevent duplicate answers for this question
local alreadyAnswered = redis.call('HEXISTS', answersKey, userId)
if alreadyAnswered == 1 then
    return cjson.encode({ error = 'ALREADY_ANSWERED', message = 'Answer already submitted for this question' })
end

-- 4. Grade answer
local isCorrect = (submittedAnswer == correctAnswer)
local pointsToAdd = isCorrect and correctPoints or incorrectPoints

-- 5. Atomically update score and record answer
redis.call('HINCRBY', scoresKey, userId, pointsToAdd)
redis.call('HSET', answersKey, userId, submittedAnswer)
if metaKey and metaKey ~= '' then
    redis.call('HSET', metaKey, userId, tostring(timeTaken))
end

-- 6. Return new total score
local newScore = redis.call('HGET', scoresKey, userId)

return cjson.encode({
    success = true,
    isCorrect = isCorrect,
    correctAnswer = correctAnswer,
    points = pointsToAdd,
    newScore = tonumber(newScore) or 0
})
```

### Scoring Rules:
- **Correct Answer**: **+4 points**
- **Incorrect Answer**: **-1 point**
- **Option Order Protection**: Options are shuffled deterministically and stored in `room:<roomId>:order:<qIndex>` so all clients see the identical option layout without leaking `isCorrect`.
