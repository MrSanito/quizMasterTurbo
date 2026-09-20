# 🛠️ QuizMaster Background Worker (`apps/worker`)

> High-throughput, distributed background processing service powered by **BullMQ** and **Redis**. Responsible for asynchronous game finalization, atomic database persistence with **Prisma**, player telemetry aggregation, and ephemeral memory garbage collection.

---

## 📖 Table of Contents

- [Overview & Architecture Rationale](#-overview--architecture-rationale)
- [Architecture & Data Flow](#-architecture--data-flow)
- [Queue & Job Specifications](#-queue--job-specifications)
- [Detailed Pipeline Stages](#-detailed-pipeline-stages)
- [Redis Key Schema Matrix](#-redis-key-schema-matrix)
- [Database Mapping & Persistence Logic](#-database-mapping--persistence-logic)
- [Observability, Retries & Error Handling](#-observability-retries--error-handling)
- [Local Development & Diagnostic CLI](#-local-development--diagnostic-cli)
- [Deployment & Operational Considerations](#-deployment--operational-considerations)
- [Roadmap & Enhancements](#-roadmap--enhancements)

---

## 🎯 Overview & Architecture Rationale

In high-concurrency multiplayer quiz games, thousands of concurrent WebSocket connections interact per room. Writing player answers, response timings, and room status directly to PostgreSQL on every question would lead to:

1. **Database Connection Saturation**: Connection pool exhaustion under spike traffic.
2. **Event Loop Latency Spikes**: Sub-10ms tick times degraded by synchronous SQL transactions.
3. **Write Amplification & Lock Contention**: Concurrent updates to the same room and leaderboard records.

### The Solution: Asynchronous Event-Driven Persistence

The background worker completely decouples live gameplay from PostgreSQL:

- **During Live Gameplay**: All player submissions, instant gradings, and leaderboard scores are handled purely in-memory via Redis Hashes and Lua scripts.
- **On Game Completion**: The WebSocket authoritative engine triggers a single `game-finished` job onto the BullMQ `game-events` queue.
- **Background Worker**: Consumes the job off the queue, compiles answers and telemetry, executes batch writes to PostgreSQL, and cleans up Redis memory with safe TTL expiration.

---

## 🏗️ Architecture & Data Flow

```mermaid
sequenceDiagram
    autonumber
    participant WS as WebSocket Engine (apps/ws)
    participant RedisQueue as BullMQ Queue (game-events)
    participant RedisState as Redis Ephemeral Storage
    participant Worker as Background Worker (apps/worker)
    participant DB as PostgreSQL (Prisma)

    WS->>RedisState: HSET room:{id}:state status="FINISHED"
    WS->>RedisQueue: addGameFinishedJob({ roomId })
    
    Note over Worker,RedisQueue: Asynchronous Event Consumption
    Worker->>RedisQueue: Dequeue 'game-finished' Job
    Worker->>DB: Query Room & Question Metadata
    
    Note over Worker,RedisState: State Gathering
    Worker->>RedisState: HGETALL room:{id}:scores
    Worker->>RedisState: HGETALL room:{id}:answers:{index}
    Worker->>RedisState: HGETALL room:{id}:answers_meta:{index}
    
    Note over Worker,DB: Batch DB Persistence
    Worker->>DB: UPDATE RoomPlayer (scores)
    Worker->>DB: INSERT PlayerAnswer (bulk answers & response times)
    Worker->>DB: UPDATE Room (state="FINISHED", endedAt=NOW())
    
    Note over Worker,RedisState: Memory Garbage Collection (TTL)
    Worker->>RedisState: EXPIRE room:{id}:* 3600s
    Worker->>RedisState: DEL room:{id}:loop_lock
    Worker->>RedisQueue: Acknowledge Job Completed
```

---

## 📨 Queue & Job Specifications

### Queue Configuration
- **Queue Name**: `game-events`
- **Underlying Client**: `ioredis` with BullMQ connection options (`maxRetriesPerRequest: null`, `enableReadyCheck: false`, `family: 4`).
- **Default Job Retry Policy**:
  - **Attempts**: 3
  - **Backoff**: Exponential (`1000ms`, `2000ms`, `4000ms`)

### Active Job Schema: `game-finished`

Dispatched when all questions in a room conclude, or the room owner terminates the game.

```typescript
interface GameFinishedJobData {
  roomId: string; // Room UUID or alphanumeric join code
}
```

```json
{
  "name": "game-finished",
  "data": {
    "roomId": "cm2a8e10x0001xyz123abc456"
  },
  "opts": {
    "attempts": 3,
    "backoff": {
      "type": "exponential",
      "delay": 1000
    }
  }
}
```

---

## ⚙️ Detailed Pipeline Stages

The worker processor in [`apps/worker/src/worker.ts`](file:///c:/Projects/quizMasterTurbo/apps/worker/src/worker.ts) executes the following sequence:

### 1. Room Identification & Hydration
- Resolves the room by its primary UUID `id` or short code `roomName` from PostgreSQL.
- Loads the configured `room.questions` ordered by `questionOrder asc`.
- Fetches all associated `Question` and `Option` records into an in-memory map for fast $O(1)$ answer validation.

### 2. Final Player Scores Synchronization
- Queries the Redis hash `room:{roomId}:scores`.
- Iterates over all participating `userId`s and executes batch updates to `prisma.roomPlayer`:
  ```typescript
  await prisma.roomPlayer.updateMany({
    where: { roomId: room.id, userId },
    data: { score: finalScore },
  });
  ```

### 3. Answer Telemetry Reconciliation & Bulk Ingestion
- Loops through each question index ($0 \dots N-1$):
  - Fetches submitted choices: `HGETALL room:{roomId}:answers:{index}`.
  - Fetches latency telemetry: `HGETALL room:{roomId}:answers_meta:{index}` (response time in ms).
- Evaluates correctness against loaded question options (matching Option UUID or option text fallback).
- Assigns question score:
  - Correct: `+4` points (or custom configured points)
  - Incorrect: `-1` points (or custom negative penalty)
  - Unanswered / Timeout: Recorded with latency and evaluated accordingly.
- Executes high-performance bulk creation via `prisma.playerAnswer.createMany` with `skipDuplicates: true`.

### 4. Room State Finalization
- Updates the database room status:
  ```typescript
  await prisma.room.update({
    where: { id: room.id },
    data: { state: "FINISHED", endedAt: new Date() },
  });
  ```

### 5. Redis Garbage Collection & Ephemeral Expiration
- Rather than immediately deleting keys (which could break players viewing end-game podiums and summary screens), sets a **1-hour TTL (`3600s`)**:
  - `room:{roomId}:state`
  - `room:{roomId}:questions`
  - `room:{roomId}:scores`
  - `room:{roomId}:answers:*`
- Immediately removes the concurrency mutex lock `room:{roomId}:loop_lock`.

---

## 🗄️ Redis Key Schema Matrix

| Key Pattern | Redis Data Type | Producer | Consumer / Lifespan | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `room:{roomId}:state` | Hash | `apps/ws` | Worker sets 3600s TTL | Room lifecycle status, current question index, question start timestamps. |
| `room:{roomId}:questions` | List | `apps/ws` | Worker sets 3600s TTL | Ordered list of question IDs assigned to the room. |
| `room:{roomId}:scores` | Hash | `apps/ws` (Lua) | Worker consumes & sets TTL | User ID $\to$ running score mappings. |
| `room:{roomId}:answers:{idx}` | Hash | `apps/ws` (Lua) | Worker consumes & sets TTL | Question index $\to$ Map of User ID to selected Option ID/text. |
| `room:{roomId}:answers_meta:{idx}` | Hash | `apps/ws` (Lua) | Worker consumes & sets TTL | Question index $\to$ Map of User ID to response time in milliseconds. |
| `room:{roomId}:loop_lock` | String (Mutex) | `apps/ws` | Worker deletes immediately | Prevents overlapping game loops and ticker races. |
| `bull:game-events:*` | BullMQ Keys | `apps/ws` | Worker process | Job metadata, active queue streams, and delayed/retry structures. |

---

## 📊 Database Mapping & Persistence Logic

```mermaid
erDiagram
    Room ||--o{ RoomPlayer : "has many"
    Room ||--o{ RoomQuestion : "contains"
    Room ||--o{ PlayerAnswer : "records"
    Question ||--o{ Option : "provides"
    Question ||--o{ RoomQuestion : "assigned to"
    User ||--o{ RoomPlayer : "participates as"
    User ||--o{ PlayerAnswer : "submits"

    Room {
        string id PK
        string roomName
        string state "NOT_STARTED | IN_PROGRESS | FINISHED"
        datetime endedAt
    }
    RoomPlayer {
        string id PK
        string roomId FK
        string userId FK
        int score
        int pointsEarned
    }
    PlayerAnswer {
        string id PK
        string roomId FK
        string roomQuestionId FK
        string userId FK
        string selectedOptionId
        boolean isCorrect
        int pointsEarned
        int responseTimeMs
    }
```

> [!NOTE]
> `PlayerAnswer` records are ingested with `skipDuplicates: true` to ensure idempotency. If a worker job is retried by BullMQ after a transient network drop, duplicate answers will not trigger unique constraint errors.

---

## 🛡️ Observability, Retries & Error Handling

### Process Lifecycles & Graceful Shutdown
The service lifecycle is managed in [`apps/worker/src/index.ts`](file:///c:/Projects/quizMasterTurbo/apps/worker/src/index.ts):
- Intercepts `SIGTERM` and `SIGINT` signals.
- Gracefully waits for ongoing jobs to complete before closing Redis handles via `worker.close()`.

```typescript
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing worker");
  await worker.close();
  process.exit(0);
});
```

### BullMQ Event Listeners
```typescript
worker.on("ready", () => {
  console.log("Worker is ready and connected to Redis.");
});

worker.on("error", (err) => {
  console.error("Worker connection error:", err);
});
```

---

## 💻 Local Development & Diagnostic CLI

### 1. Environment Configuration (`apps/worker/.env`)
```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/quizmaster?schema=public"

# Redis connection (Single URL or individual components)
REDIS_URL="redis://default:password@localhost:6379"

# Or component fallback:
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
```

### 2. Available Scripts

Run commands from the repository root using Turbo, or directly inside `apps/worker`:

```bash
# Start background worker in watch mode
npm run dev --workspace=apps/worker

# Type-check worker TypeScript files
npm run build --workspace=apps/worker

# Run in production mode
npm start --workspace=apps/worker
```

### 3. Room State Diagnostic CLI Tool

A built-in inspection tool is provided in [`apps/worker/src/debug-room.ts`](file:///c:/Projects/quizMasterTurbo/apps/worker/src/debug-room.ts) to verify Redis keys and PostgreSQL status for a given room without launching a full client session:

```bash
# Execute inspection against a room code or UUID
npx tsx apps/worker/src/debug-room.ts <ROOM_ID_OR_NAME>
```

#### Diagnostic Output Example:
```text
 --- DEBUGGING ROOM: room-alpha-12 ---

 Redis Connected

--- DATABASE CHECK ---
 Room Found: room-alpha-12 (cm2a8e10x0001xyz123abc456)
   State: FINISHED
   Questions in DB: 5

--- REDIS CHECK ---
 Key 'room:room-alpha-12:questions': Length = 5
   Q0 (quest_001)
       Key: room:room-alpha-12:answers:0 -> Exists: YES, Count: 4
       Data: { "usr_1": "opt_A", "usr_2": "opt_B" }
   Q1 (quest_002)
       Key: room:room-alpha-12:answers:1 -> Exists: YES, Count: 4
       Data: { "usr_1": "opt_C", "usr_2": "opt_C" }
-------------------------
```

---

## 🚀 Deployment & Operational Considerations

### Horizontal Scaling
- **Stateless Workers**: BullMQ uses Redis atomic primitives to coordinate job distribution across workers. Multiple instances of `apps/worker` can run in parallel without race conditions.
- **Concurrency**: Adjust worker concurrency via the BullMQ Worker options:
  ```typescript
  new Worker("game-events", processor, { connection, concurrency: 5 });
  ```

### Memory Footprint
- The worker is lightweight and requires minimal memory ($\approx 60\text{MB}$ heap on Node 20).
- Compatible with Docker containers, PM2 cluster mode, Render Background Workers, and AWS ECS/Fargate tasks.

---

## 🗺️ Roadmap & Enhancements

- [ ] **Prisma Transaction Wrapping**: Wrap `RoomPlayer` score updates, `PlayerAnswer` bulk creation, and `Room` finalization inside a unified `prisma.$transaction([...])` block for strict ACID guarantees.
- [ ] **SCAN-based Non-Blocking Redis Cleanup**: Transition `redisClient.keys()` calls to direct index lookups or non-blocking `SCAN` iteration to avoid blocking single-threaded Redis engines.
- [ ] **Dual-Field Score Synchronization**: Mirror `finalScore` to both `score` and `pointsEarned` fields on `RoomPlayer` to maintain parity across all HTTP API endpoints.
- [ ] **Dynamic Question Scoring**: Retrieve `points` and `negativePoints` directly from the database schema rather than utilizing hardcoded $+4 / -1$ defaults.
- [ ] **`game-aborted` Queue Consumer**: Add consumer logic to safely clean up abandoned games and release locks without persisting incomplete rounds.
- [ ] **Player Career Stats Pipeline**: Trigger asynchronous aggregation of user profiles (total games played, win rate, average response speed, Elo score adjustments) upon room finalization.
