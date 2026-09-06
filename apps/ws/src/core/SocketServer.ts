import type { Server } from "socket.io";

export class SocketServer {
	private static instance: SocketServer | null = null;
	private io: Server | null = null;

	private constructor() {}

	public static getInstance(): SocketServer {
		if (!SocketServer.instance) {
			SocketServer.instance = new SocketServer();
		}
		return SocketServer.instance;
	}

	public static initialize(io: Server): SocketServer {
		const instance = SocketServer.getInstance();
		instance.setIO(io);
		return instance;
	}

	public setIO(io: Server): void {
		this.io = io;
	}

	public getIO(): Server {
		if (!this.io) {
			throw new Error(
				"[SocketServer] Socket.IO instance has not been initialized. Call initialize(io) or setIO(io) first.",
			);
		}
		return this.io;
	}

	public isInitialized(): boolean {
		return this.io !== null;
	}
}

export default SocketServer;
