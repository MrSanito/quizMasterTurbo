# 🔌 WebSocket Engine Singleton Refactoring Guide

This document describes the step-by-step instructions for refactoring the `apps/ws` WebSocket server into a highly scalable, strongly-typed, and thread-safe **Singleton Architecture** with atomic Redis transactions.

---

## 📂 Proposed File Structure

```
apps/ws/
├── src/
│   ├── config/
│   │   └── env.ts                     # Validated environment variables (Zod)
│   ├── constants/
│   │   ├── events.constants.ts        # Socket event name constants
│   │   └── game.constants.ts          # QUESTION_TIME, BREAK_TIME, POINTS
│   ├── core/                          # ⭐ SINGLETONS & ENGINE
│   │   ├── RedisManager.ts            # Singleton: Redis connections & Lua scripts
│   │   ├── SocketServer.ts            # Singleton: Typed Socket.IO server & Adapter
│   │   ├── GameEngine.ts              # Singleton: Authoritative Game Loop & Logic
│   │   ├── APIService.ts              # Singleton: HTTP API Client / Results Saver
│   ├── handlers/                      # Socket connection & disconnect routing
│   │   ├── connection.handler.ts      # Connection entry point
│   │   └── disconnect.handler.ts      # Granular disconnect & reconnection handling
│   ├── listeners/                     # Modular event listeners
│   │   ├── lobby.listener.ts          # Lobby joining, ready state, host start
│   │   └── game.listener.ts           # Game joining, sync, answer submission
│   ├── lua/                           # 🚀 High-performance atomic Redis scripts
│   │   └── submit_answer.lua          # Atomic answer check, grading, and score update
│   ├── schemas/                       # Runtime Zod validation schemas
│   │   ├── lobby.schema.ts
│   │   └── game.schema.ts
│   ├── types/                         # Strict TypeScript definitions
│   │   ├── events.types.ts            # Typed Server-Client Socket.IO events
│   │   └── game.types.ts              # Game state, questions, player, payload interfaces
│   └── index.ts                       # Clean bootstrap entry point
```

---

## 🛠️ Step-by-Step Migration Guide

### Step 1: Install Dependencies
Install the required Redis Pub/Sub adapter and Zod validation library:
```bash
npm install "@socket.io/redis-adapter" zod
```

### Step 2: Set up Configuration & Constants
1. Create `src/config/env.ts` to parse environment variables (`PORT`, `REDIS_URL`, `API_URL`) using Zod.
2. Create `src/constants/events.constants.ts` to keep socket events centralized.
3. Create `src/constants/game.constants.ts` to define game timeouts and point structures.

### Step 3: Define TypeScript Types & Schemas
1. Create `src/types/events.types.ts` to define strongly typed Socket.IO payloads (`ClientToServerEvents`, `ServerToClientEvents`).
2. Create `src/types/game.types.ts` to define interfaces for Game States, questions, and player structures.
3. Create Zod schemas in `src/schemas/` to parse and validate incoming client payloads at runtime.

### Step 4: Add the Atomic Lua Script
Create `src/lua/submit_answer.lua`. This script executes atomically inside Redis to grade answers, update scores, and prevent double answer submissions in a single operation:
- Verify game state is `PLAYING`.
- Check if player already answered.
- Update scores and save metadata.

### Step 5: Implement the Core Singletons (`src/core/`)
1. **`RedisManager.ts`**: Implements the connection pool, pre-loads the Lua script into Redis, and returns dedicated clients (`client`, `pubClient`, `subClient`).
2. **`SocketServer.ts`**: Encapsulates Socket.IO server initialization, attaches the Redis Adapter, and routes connections to listeners.
3. **`GameEngine.ts`**: Coordinates authoritative game logic, ticks question loops, manages game timers in memory, and submits final results.
4. **`APIService.ts`**: Rest Client posting structured results to `/api/v1/game/save` on the primary HTTP Server.

### Step 6: Create Handlers & Listeners
1. Create connection and disconnect handlers in `src/handlers/`.
2. Move connection callbacks to modular event listeners in `src/listeners/lobby.listener.ts` and `src/listeners/game.listener.ts`.

### Step 7: Refactor Entry Point (`src/index.ts`)
Update `src/index.ts` to bootstrap the application:
1. Initialize the `RedisManager` instance.
2. Call `redisManager.loadLuaScripts()` to register the atomic Lua script.
3. Initialize the `SocketServer` with the HTTP server.
4. Start listening on the validated `env.PORT`.

### Step 8: Clean up Legacy Code
Remove all old and unused directories:
- Remove `src/socket.ts`
- Remove `src/handler/`
- Remove `src/services/`
- Remove `src/events/`
