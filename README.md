# QuizMasterTurbo

A real-time, multiplayer quiz application built with a modern monorepo architecture. 

## Features

- **Monorepo Architecture**: Managed with Turborepo for fast, scalable development.
- **Frontend App**: Interactive user interface built with Next.js (App Router).
- **HTTP API**: Dedicated RESTful API service for core application logic.
- **Real-Time Engine**: WebSocket service for live, multiplayer gameplay.
- **Background Processing**: Worker service for heavy lifting and async tasks.
- **Secure Authentication**: Includes Google Login, JWT, and session management.
- **Database**: Type-safe database interactions using Prisma ORM.

## Tech Stack

- **Frontend**: Next.js (React), TailwindCSS
- **Backend**: Node.js, Express/Fastify (HTTP), WebSockets (WS)
- **Database**: PostgreSQL (via Prisma ORM), Redis (for caching & pub/sub)
- **Monorepo**: Turborepo, npm/yarn workspaces

## Authentication Flow

1. Users log in via Google OAuth or standard credentials on the Next.js frontend.
2. The HTTP API validates the request and generates a short-lived **Access Token** and a long-lived **Refresh Token**.
3. The Refresh Token is stored securely in an `httpOnly` cookie, while the Access Token is kept in memory.
4. Prisma tracks active sessions in the database for secure session management and revocation.
## Getting Started

Install dependencies:
```bash
npm install
```

Start the development servers:
```bash
npx turbo dev
```
