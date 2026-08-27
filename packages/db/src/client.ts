import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";

let prismaInstance: PrismaClient | null = null;

export const getPrisma = (): PrismaClient => {
	const isWorker = typeof globalThis.WebSocket !== "undefined" && !process.env.PORT;

	if (isWorker) {
		const rawUrl = process.env.DATABASE_URL;
		if (!rawUrl || rawUrl === "undefined") {
			throw new Error("DATABASE_URL environment variable is missing, empty, or undefined during initialization.");
		}
		const connectionString = rawUrl
			.replace(/([?&])channel_binding=[^&]*/g, "$1")
			.replace(/[?&]$/g, "");

		const adapter = new PrismaNeon({ connectionString });
		return new PrismaClient({ adapter });
	}

	if (!prismaInstance) {
		const rawUrl = process.env.DATABASE_URL;
		if (!rawUrl || rawUrl === "undefined") {
			throw new Error("DATABASE_URL environment variable is missing, empty, or undefined during initialization.");
		}

		let connectionString = rawUrl;
		connectionString = connectionString.replace(/([?&])channel_binding=[^&]*/g, "$1");
		connectionString = connectionString.replace(/[?&]$/g, "");
		
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
