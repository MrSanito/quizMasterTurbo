import "dotenv/config";

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Validate env INSIDE db package
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

// Create pg pool
const pool = new Pool({
  connectionString,
});

// ✅ Prisma v7 adapter (THIS is the correct constructor)
const adapter = new PrismaPg(pool);

// Singleton for dev
const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
