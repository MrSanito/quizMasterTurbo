# QuizMasterTurbo

A high-performance, real-time multiplayer quiz application built with a modern TypeScript monorepo architecture.

## Overview

QuizMasterTurbo powers competitive real-time quizzes with synchronized gameplay, atomic scoring, low-latency WebSocket communication, and resilient background job processing. Decoupled across modular services and shared internal packages using Turborepo, it is designed for horizontal scale and developer ergonomics.

---

## Architecture & Monorepo Structure

```
quizMasterTurbo/
├── apps/
│   ├── quizMaster/          # Next.js 16 frontend (React 19, TailwindCSS, Redux Toolkit, Socket.io client)
│   ├── http/                # Express REST API for auth, room management, user profiles & Swagger docs
│   ├── ws/                  # Low-latency Socket.io server managing live game rooms & state recovery
│   ├── worker/              # BullMQ queue worker for async task processing & stat aggregation
│   └── hono/                # High-throughput Hono API service (Node.js / Cloudflare Workers)
│
├── packages/
│   ├── db/                  # Prisma schema, client, and database migrations (PostgreSQL)
│   ├── redis/               # Redis client connection, pub/sub, and caching utilities
│   ├── queue/               # BullMQ queue definitions and job payloads
│   ├── types/               # Shared TypeScript schemas, DTOs, and socket events
│   ├── services/            # Shared domain business logic
│   ├── ui/                  # Shared React UI component library
│   ├── eslint-config/       # Shared ESLint configurations
│   └── typescript-config/   # Base TypeScript configurations
```

---

## Features

- **Monorepo Architecture**: Managed with Turborepo for optimized caching, shared packages, and unified builds.
- **Modern Frontend**: Interactive UI built with Next.js (App Router), TailwindCSS, Framer Motion, and DaisyUI.
- **RESTful APIs**: Express 5 and Hono microservices handling user authentication, profiles, and quiz orchestration.
- **Real-Time Game Engine**: Socket.io engine supporting live room lobbies, dynamic participant tracking, and synchronized question countdowns.
- **Atomic Scoring & Fair Play**: Anti-cheat countdown verification and atomic response evaluation with Redis Lua scripts.
- **Background Worker**: Asynchronous queue processing with BullMQ for persistent stat computation and automated emails.
- **Secure Authentication**: Google OAuth, JWT with DPoP proof verification, session revocation, and ephemeral single-use WebSocket tickets.
- **Type-Safe Database**: Fully typed schema with PostgreSQL via Prisma ORM.

---

## Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16, React 19, TailwindCSS, Redux Toolkit, Framer Motion, Socket.io Client |
| **Backend APIs** | Node.js, Express 5, Hono, Swagger UI |
| **Real-Time WS** | Socket.io, Redis Pub/Sub, Lua Scripting |
| **Queues & Async** | BullMQ, IORedis |
| **Database & Cache** | PostgreSQL (via Prisma ORM), Redis |
| **Tooling & Linter** | Turborepo, Biome, TypeScript 5 |

---

## Service Topology & Ports

| Service | Port | Description |
| :--- | :--- | :--- |
| **quizMaster** | `3000` | Web application (Next.js App Router) |
| **http** | `3001` | Core REST API (Express) with OpenAPI at `/api/docs` |
| **ws** | `3002` | WebSocket game engine with health checks at `/health` |
| **hono** | `3001` (alt) | Edge / alternative high-throughput HTTP service |
| **worker** | — | Headless BullMQ background queue consumer |

---

## Authentication & Real-Time Flow

1. **Sign-In & Tokens**: Users authenticate via Google OAuth or credentials on the Next.js client. The API validates credentials and issues an Access Token alongside an `httpOnly` Refresh Token.
2. **Session Revocation**: Prisma tracks active sessions in PostgreSQL, enabling immediate device or user logout across all services.
3. **Ephemeral WebSocket Tickets**: Before opening a Socket.io stream, clients request an ephemeral, single-use ticket from the HTTP API. The WebSocket server validates and burns this ticket upon connection handshake.
4. **Synchronized Game State**: The WebSocket engine utilizes Redis-backed distributed state and Lua scripts to guarantee atomic answer submissions, preventing race conditions or replay attacks.

---

## Environment Configuration

Create a `.env` file in the project root (or set corresponding environment variables in your deployment platform):

```ini
# PostgreSQL Database (Neon / Supabase / Local)
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"

# Redis Instance (Redis Cloud / Local)
REDIS_URL="redis://default:password@host:port"

# Authentication Secrets
ACCESS_TOKEN_SECRET="your-access-token-secret"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"

# OAuth & Mail (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
RESEND_API_KEY="re_your_resend_key"
```

---

## Getting Started

### 1. Prerequisites
- Node.js >= 20.0.0
- npm >= 10.8.2
- A running PostgreSQL database
- A running Redis server

### 2. Installation
```bash
npm install
```

### 3. Database Setup
Generate the Prisma Client and run database migrations:
```bash
# Generate Prisma client
npm run db:generate

# Apply migrations
npm run db:migrate
```

### 4. Running the Development Environment
Launch all workspace applications concurrently with Turborepo:
```bash
npm run dev
```

You can also run specific services independently:
```bash
# Frontend only
npx turbo run dev --filter=quizMaster

# HTTP API only
npx turbo run dev --filter=http

# WebSocket server only
npx turbo run dev --filter=ws

# Worker only
npx turbo run dev --filter=worker
```

---

## Code Quality & Scripts

| Command | Action |
| :--- | :--- |
| `npm run check` | Run Biome lint and formatting diagnostics |
| `npm run check:fix` | Automatically apply Biome code fixes |
| `npm run format` | Format entire codebase using Biome |
| `npm run check-types` | Verify TypeScript types across all packages |
| `npm run build` | Build all applications and packages |
| `npm run db:deploy` | Apply database migrations to production |

---

## Deployment

- **Render Blueprints**: The repository includes `render.yaml` preconfigured to deploy both the Express HTTP service and the WebSocket server with automatic health checks.
- **Cloudflare Workers (Hono)**: The `apps/hono` service can be deployed directly with `npm run deploy:hono` using Wrangler.
- **Frontend (Vercel / Node)**: The `apps/quizMaster` Next.js application is ready for zero-config deployment on Vercel or any containerized Node environment.
