"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const client_js_1 = require("../generated/prisma/client.js");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
// Validate env INSIDE db package
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is missing");
}
// Create pg pool
const pool = new pg_1.Pool({
    connectionString,
});
// ✅ Prisma v7 adapter (THIS is the correct constructor)
const adapter = new adapter_pg_1.PrismaPg(pool);
// Singleton for dev
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ??
    new client_js_1.PrismaClient({
        adapter,
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
