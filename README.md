# QuizMasterTurbo

A high-performance, real-time multiplayer quiz application built with a modern TypeScript monorepo architecture.

## Overview

QuizMasterTurbo powers competitive real-time quizzes with synchronized gameplay, atomic scoring, low-latency WebSocket communication, and resilient background job processing. Built using Turborepo, it decouples concerns across dedicated microservices and shared internal packages.

---

## Architecture & Monorepo Structure

```
quizMasterTurbo/
├── apps/
│   ├── quizMaster/          # Next.js 16 frontend (App Router, TailwindCSS, Redux Toolkit, Socket.io client)
│   ├── http/                # Express REST API for auth, room management, and user data
│   ├── ws/                  # Low-latency Socket.io WebSocket server managing live game rooms
│   ├── worker/              # BullMQ queue worker for async operations & game state finalization
│   └── hono/                # Lightweight, high-throughput edge/Node API service
│
├── packages/
│   ├── db/                  # Prisma schema, client, and database migrations (PostgreSQL)
│   ├── redis/               # Redis client instances, caching, and pub/sub utilities
│   ├── queue/               # BullMQ queue definitions and job payloads
│   ├── types/               # Shared TypeScript schemas, DTOs, and interfaces
│   ├── services/            # Shared domain business logic
│   ├── ui/                  # Shared React UI component library
│   ├── eslint-config/       # Linting presets
│   └── typescript-config/   # Shared tsconfig configurations
```

---

## Features

- **Monorepo Architecture**: Managed with Turborepo for fast builds, shared packages, and unified tooling.
- **Modern Frontend**: Interactive UI built with Next.js (App Router), TailwindCSS, and Framer Motion.
- **RESTful HTTP API**: Modular Express & Hono APIs handling authentication, user profiles, and room orchestration.
- **Real-Time Game Engine**: Socket.io engine supporting live room lobbies, dynamic participant tracking, and synchronized question countdowns.
- **Atomic Scoring & Fair Play**: Anti-cheat countdown verification and atomic response evaluation.
- **Background Worker**: Asynchronous queue processing via BullMQ for persistent stat aggregation and emails.
- **Secure Authentication**: Google OAuth, JWT tokens, DPoP token verification, and database-backed session revocation.
- **Type-Safe Database**: Fully typed schema with PostgreSQL via Prisma ORM.

---

## Tech Stack

- **Frontend**: Next.js 16 (React 19), TailwindCSS, Redux Toolkit, Lucide Icons, Framer Motion
- **Backend & APIs**: Node.js, Express 5, Hono, Socket.io
- **Database & Cache**: PostgreSQL (via Prisma ORM), Redis (ioredis)
- **Queue & Async**: BullMQ
- **Tooling**: Turborepo, Biome, TypeScript

---

## Authentication Flow

1. **Sign-In**: Users authenticate via Google OAuth or credentials on the Next.js client.
2. **Token Generation**: The HTTP API validates credentials and issues a short-lived **Access Token** and a secure **Refresh Token**.
3. **Session Management**: Active sessions and tokens are tracked via Prisma in PostgreSQL to allow instant revocation.
4. **WebSocket Tickets**: Clients exchange their session credentials for ephemeral single-use WebSocket tickets to establish secure, authenticated real-time connections.

---

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- PostgreSQL database
- Redis instance (local or cloud)

### Installation
```bash
npm install
```

### Running Locally
```bash
npx turbo dev
```
