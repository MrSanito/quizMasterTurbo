import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";

let prismaInstance: PrismaClient | null = null;

export const getPrisma = (): PrismaClient => {
	if (!prismaInstance) {
		let connectionString = `${process.env.DATABASE_URL}`;
		
		// Clean up connection string: strip unsupported channel_binding parameter
		connectionString = connectionString.replace(/([?&])channel_binding=[^&]*/g, "$1");
		// Remove trailing ? or & if left behind
		connectionString = connectionString.replace(/[?&]$/g, "");

		if (!process.env.DATABASE_URL) {
			console.warn("WARNING: DATABASE_URL is not set at the time of database connection initialization.");
		}
		
		// Configure WebSocket constructor when running under Node.js (for local dev)
		if (typeof globalThis.WebSocket === "undefined") {
			const ws = require("ws");
			neonConfig.webSocketConstructor = ws;
		}

		const adapter = new PrismaNeon({ connectionString });
		prismaInstance = new PrismaClient({ adapter });
	}
	return prismaInstance;
};

// Export prisma as a proxy to defer pool initialization until first access
export const prisma = new Proxy({} as PrismaClient, {
	get(target, prop, receiver) {
		const instance = getPrisma();
		const value = Reflect.get(instance, prop, receiver);
		if (typeof value === "function") {
			return value.bind(instance);
		}
		return value;
	},
});
