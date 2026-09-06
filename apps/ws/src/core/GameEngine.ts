import { RedisManager } from "./RedisManager.js";
import { SocketServer } from "./SocketServer.js";
import { QueueManager } from "./QueueManager.js";

// ===================== CONSTANTS =====================
const QUESTION_TIME = 15000;       // 15 seconds per question
const BREAK_TIME = 5000;           // 5 seconds break between questions
const COUNTDOWN = 5000;            // 5 seconds start countdown
const PLAYER_GRACE_PERIOD = 30000; // 30 seconds player reconnection grace period
const HOST_GRACE_PERIOD = 30000;   // 30 seconds host reconnection grace period
const POINTS_CORRECT = 4;          // +4 points for correct answer
const POINTS_INCORRECT = -1;       // -1 points for incorrect answer

// ===================== TYPES =====================
export type GameStatus =
	| "LOBBY"
	| "WAITING"
	| "COUNTDOWN"
	| "PLAYING"
	| "BREAK"
	| "FINISHED"
	| "ABORTED";

export interface PlayerProfile {
	id?: string | undefined;
	username?: string | undefined;
	name?: string | undefined;
	avatar?: string | undefined;
}

export interface PlayerData {
	id: string;
	username: string;
	name?: string | undefined;
	avatar: string;
	socketId: string;
	connected: boolean;
	lastSeen: number;
	score: number;
}

export interface QuestionOption {
	id?: string | undefined;
	text: string;
	isCorrect?: boolean | undefined;
}

export interface RawQuestion {
	id?: string | undefined;
	text?: string | undefined;
	questionText?: string | undefined;
	Option?: QuestionOption[] | undefined;
	options?: (string | QuestionOption)[] | undefined;
	correct?: string | undefined;
	correctOptionId?: string | undefined;
	correctOptionText?: string | undefined;
	imageUrl?: string | undefined;
}

export interface ClientQuestion {
	id: string;
	text: string;
	options: string[];
	imageUrl?: string | undefined;
}

export interface LeaderboardEntry {
	userId: string;
	name: string;
	avatar?: string | undefined;
	score: number;
	rank?: number | undefined;
	connected?: boolean | undefined;
}

export interface RoomState {
	status: GameStatus;
	hostId?: string | undefined;
	quizId?: string | undefined;
	currentQuestionIndex: number;
	questionStartTime: number;
	totalQuestions: number;
}

export interface SubmitAnswerResult {
	success?: boolean | undefined;
	isCorrect?: boolean | undefined;
	correctOptionText?: string | undefined;
	points?: number | undefined;
	newScore?: number | undefined;
	error?: string | undefined;
	message?: string | undefined;
}

export interface SyncPayload {
	gameState: GameStatus;
	status: GameStatus;
	myScore: number;
	leaderboard: LeaderboardEntry[];
	currentQuestion: ClientQuestion | null;
	questionIndex: number;
	totalQuestions: number;
	timeLeft: number;
	startTime: number;
	elapsedMs: number | null;
	alreadyAnswered: boolean;
	userAnswer: string | null;
}

/**
 * GameEngine is the authoritative Live Game State Machine singleton for QuizMaster Turbo.
 * It manages real-time lobby lifecycles, timer synchronization, Lua-based atomic grading,
 * crash recovery, and asynchronous background persistence.
 */
export class GameEngine {
	private static instance: GameEngine | null = null;
	#activeTimers = new Map<string, NodeJS.Timeout>();

	private constructor() {}

	public static getInstance(): GameEngine {
		if (!GameEngine.instance) {
			GameEngine.instance = new GameEngine();
		}
		return GameEngine.instance;
	}

	// ===================== REDIS KEY HELPERS =====================

	private getRoomKey(roomId: string, suffix: string): string {
		return `room:${roomId}:${suffix}`;
	}

	private getStateKey(roomId: string): string {
		return `room:${roomId}:state`;
	}

	private getPlayersKey(roomId: string): string {
		return `room:${roomId}:players`;
	}

	private getScoresKey(roomId: string): string {
		return `room:${roomId}:scores`;
	}

	private getQuestionsKey(roomId: string): string {
		return `room:${roomId}:questions`;
	}

	private getAnswersKey(roomId: string, qIndex: number): string {
		return `room:${roomId}:answers:${qIndex}`;
	}

	private getMetaKey(roomId: string, qIndex: number): string {
		return `room:${roomId}:answers_meta:${qIndex}`;
	}

	private getOrderKey(roomId: string, qIndex: number): string {
		return `room:${roomId}:order:${qIndex}`;
	}

	private getLockKey(roomId: string): string {
		return `room:${roomId}:loop_lock`;
	}

	private getSocketMetaKey(socketId: string): string {
		return `socket:${socketId}:meta`;
	}

	// ===================== LOBBY LIFECYCLE =====================

	/**
	 * Player or Host joins the room lobby.
	 * Updates Redis player data, cancels any active grace periods, and broadcasts the updated roster.
	 */
	public async joinRoom(
		roomId: string,
		userId: string,
		socketId: string,
		profile?: PlayerProfile,
	): Promise<void> {
		const redis = RedisManager.getInstance();
		const io = SocketServer.getInstance().getIO();

		const stateKey = this.getStateKey(roomId);
		const playersKey = this.getPlayersKey(roomId);
		const socketMetaKey = this.getSocketMetaKey(socketId);

		const stateRaw = await redis.getHash(stateKey);
		const status = (stateRaw.status as GameStatus) || "LOBBY";

		if (status === "ABORTED") {
			const abortPayload = {
				message: "This room has been aborted and closed",
				reason: "ABORTED",
			};
			io.to(socketId).emit("lobby:aborted", abortPayload);
			io.to(socketId).emit("game:aborted", abortPayload);
			return;
		}

		// Retrieve or verify host ID
		const hostId = stateRaw.hostId || (await this.getHostId(roomId));

		// If no hostId found, room does not exist or was destroyed
		if (!hostId) {
			const abortPayload = {
				message: "This room has been aborted and closed",
				reason: "ABORTED",
			};
			io.to(socketId).emit("lobby:aborted", abortPayload);
			io.to(socketId).emit("game:aborted", abortPayload);
			return;
		}

		// Persist hostId and status in room state if missing
		await redis.getClient().hset(stateKey, "hostId", hostId);
		if (!stateRaw.status) {
			await redis.getClient().hset(stateKey, "status", "LOBBY");
		}
		await redis.expire(stateKey, 7200);

		// If game already in progress, warn player
		if (
			status !== "LOBBY" &&
			status !== "WAITING" &&
			status !== "COUNTDOWN" &&
			status !== "PLAYING" &&
			status !== "BREAK"
		) {
			const errorPayload = {
				message: `Room status is ${status}. Game cannot be joined.`,
			};
			io.to(socketId).emit("game:error", errorPayload);
			io.to(socketId).emit("error", errorPayload);
			return;
		}

		// Retrieve existing player data to preserve previous score/stats on reconnect
		const existingPlayerRaw = await redis.getClient().hget(playersKey, userId);
		let existingScore = 0;
		let existingSocketId: string | null = null;
		if (existingPlayerRaw) {
			try {
				const parsed = JSON.parse(existingPlayerRaw);
				existingScore = parsed.score || 0;
				existingSocketId = parsed.socketId || null;
			} catch {
				// ignore JSON parse error
			}
		}

		// Enforce single active session per user UUID:
		// If player connects with a new socketId, gracefully disconnect previous socket session
		if (existingSocketId && existingSocketId !== socketId) {
			console.log(`⚠️ [GameEngine] Duplicate session detected for user UUID ${userId}. Disconnecting old socket ${existingSocketId}`);
			io.to(existingSocketId).emit("lobby:duplicateSession", {
				message: "You opened this quiz room in another tab or window.",
				reason: "DUPLICATE_SESSION",
			});
			io.to(existingSocketId).emit("game:duplicateSession", {
				message: "You opened this quiz room in another tab or window.",
				reason: "DUPLICATE_SESSION",
			});
			const oldSocket = io.sockets.sockets.get(existingSocketId);
			if (oldSocket) {
				oldSocket.disconnect(true);
			}
			await redis.del(this.getSocketMetaKey(existingSocketId));
		}

		const username =
			profile?.name ||
			profile?.username ||
			(existingPlayerRaw ? JSON.parse(existingPlayerRaw).username : null) ||
			`Player_${userId.slice(0, 4)}`;

		const avatar =
			profile?.avatar ||
			(existingPlayerRaw ? JSON.parse(existingPlayerRaw).avatar : null) ||
			"avatar1.svg";

		const playerData: PlayerData = {
			id: userId,
			username,
			avatar,
			socketId,
			connected: true,
			lastSeen: Date.now(),
			score: existingScore,
		};

		// Write player data and reverse lookup map
		await redis.getClient().hset(playersKey, userId, JSON.stringify(playerData));
		await redis.expire(playersKey, 7200);

		await redis.setHash(socketMetaKey, { roomId, userId });
		await redis.expire(socketMetaKey, 7200);

		// Ensure scores hash exists for player
		const hasScore = await redis.getClient().hexists(this.getScoresKey(roomId), userId);
		if (!hasScore) {
			await redis.getClient().hset(this.getScoresKey(roomId), userId, String(existingScore));
			await redis.expire(this.getScoresKey(roomId), 7200);
		}

		// Cancel player grace timer if reconnecting
		this.clearTimer(`playerGrace:${roomId}:${userId}`);

		// Cancel host grace timers if host is reconnecting
		if (userId === hostId) {
			this.clearTimer(`hostGrace:${roomId}`);
			this.clearTimer(`hostGraceTick:${roomId}`);
			console.log(`👑 [GameEngine] Host ${userId} reconnected to room ${roomId}`);
			io.to(roomId).emit("lobby:hostReconnected");
		}

		const playerList = await this.getPlayerList(roomId);
		io.to(roomId).emit("lobby:players", playerList);

		// Broadcast live announcement event (transient frontend state only)
		io.to(roomId).emit("lobby:playerJoined", {
			userId,
			name: username,
			avatar,
			timestamp: Date.now(),
		});
	}

	/**
	 * Player leaves room lobby voluntarily.
	 */
	public async leaveRoom(roomId: string, userId: string, socketId?: string): Promise<void> {
		const redis = RedisManager.getInstance();
		const io = SocketServer.getInstance().getIO();
		const playersKey = this.getPlayersKey(roomId);

		// If a socketId was provided, check if it's the active socket for this user UUID
		if (socketId) {
			const rawCurrentPlayer = await redis.getClient().hget(playersKey, userId);
			if (rawCurrentPlayer) {
				try {
					const currentPlayer = JSON.parse(rawCurrentPlayer);
					if (currentPlayer.socketId && currentPlayer.socketId !== socketId && currentPlayer.connected) {
						console.log(`🔌 [GameEngine] Ignoring leaveRoom from stale socket ${socketId} for user UUID ${userId}. Active socket is ${currentPlayer.socketId}`);
						return;
					}
				} catch {
					// ignore
				}
			}
		}

		const stateKey = this.getStateKey(roomId);
		const stateRaw = await redis.getHash(stateKey);
		const hostId = stateRaw.hostId || (await this.getHostId(roomId));

		const isLobby =
			!stateRaw.status ||
			stateRaw.status === "LOBBY" ||
			stateRaw.status === "WAITING" ||
			stateRaw.status === "CREATED";

		if (userId === hostId && isLobby) {
			console.warn(`👑 [GameEngine] Host ${userId} leaving lobby ${roomId}. Starting 30s grace countdown.`);
			await this.handleHostDisconnect(roomId);
			return;
		}

		const rawPlayer = await redis.getClient().hget(playersKey, userId);
		let playerName = `Player_${userId.slice(0, 4)}`;
		let avatar = "avatar1.svg";
		if (rawPlayer) {
			try {
				const p = JSON.parse(rawPlayer);
				playerName = p.username || p.name || playerName;
				avatar = p.avatar || avatar;
			} catch {
				// ignore
			}
		}

		await redis.getClient().hdel(playersKey, userId);

		const playerList = await this.getPlayerList(roomId);
		io.to(roomId).emit("lobby:players", playerList);

		// Broadcast live announcement event
		io.to(roomId).emit("lobby:playerLeft", {
			userId,
			name: playerName,
			avatar,
			timestamp: Date.now(),
		});
	}

	/**
	 * Main disconnect router. Detects if user is host or player and applies appropriate grace logic.
	 */
	public async handleDisconnect(roomId: string, userId: string, socketId?: string): Promise<void> {
		const redis = RedisManager.getInstance();
		const io = SocketServer.getInstance().getIO();
		const stateKey = this.getStateKey(roomId);
		const playersKey = this.getPlayersKey(roomId);
		const stateRaw = await redis.getHash(stateKey);
		const hostId = stateRaw.hostId || (await this.getHostId(roomId));

		console.log(`🔌 [GameEngine] handleDisconnect: roomId=${roomId}, userId=${userId}, socketId=${socketId}, hostId=${hostId}`);

		// Check if this disconnect event belongs to a stale/replaced socket for this user UUID
		if (socketId) {
			const rawCurrentPlayer = await redis.getClient().hget(playersKey, userId);
			if (rawCurrentPlayer) {
				try {
					const currentPlayer = JSON.parse(rawCurrentPlayer);
					if (currentPlayer.socketId && currentPlayer.socketId !== socketId && currentPlayer.connected) {
						console.log(`🔌 [GameEngine] Ignoring disconnect from stale socket ${socketId} for user UUID ${userId}. Active socket is ${currentPlayer.socketId}`);
						return;
					}
				} catch {
					// ignore
				}
			}
		}

		const isLobby =
			!stateRaw.status ||
			stateRaw.status === "LOBBY" ||
			stateRaw.status === "WAITING" ||
			stateRaw.status === "CREATED";

		if (userId === hostId) {
			if (isLobby) {
				console.warn(`👑 [GameEngine] Host ${userId} socket disconnected from lobby ${roomId}. Starting host grace period.`);
				await this.handleHostDisconnect(roomId);
				return;
			}
			console.log(`👑 [GameEngine] Host ${userId} disconnected during active game ${roomId}. Treating as normal player disconnect.`);
			await this.handlePlayerDisconnect(roomId, userId);
			return;
		}

		if (isLobby) {
			const rawPlayer = await redis.getClient().hget(playersKey, userId);
			let playerName = `Player_${userId.slice(0, 4)}`;
			let avatar = "avatar1.svg";
			if (rawPlayer) {
				try {
					const p = JSON.parse(rawPlayer);
					playerName = p.username || p.name || playerName;
					avatar = p.avatar || avatar;
				} catch {
					// ignore
				}
			}

			// Immediately remove player from lobby when tab is closed (Ctrl+W)
			await redis.getClient().hdel(playersKey, userId);
			const playerList = await this.getPlayerList(roomId);
			io.to(roomId).emit("lobby:players", playerList);

			// Broadcast live announcement event
			io.to(roomId).emit("lobby:playerLeft", {
				userId,
				name: playerName,
				avatar,
				timestamp: Date.now(),
			});
			console.log(`👋 [GameEngine] Player ${playerName} (${userId}) left lobby ${roomId} (tab closed)`);
		} else {
			// During active gameplay (COUNTDOWN, PLAYING, BREAK), apply 30s grace period for reloads
			await this.handlePlayerDisconnect(roomId, userId);
		}
	}

	/**
	 * Handles host disconnection by granting a 30s grace period.
	 * If the host does not reconnect before grace expires, the game is aborted.
	 */
	public async handleHostDisconnect(roomId: string): Promise<void> {
		const redis = RedisManager.getInstance();
		const io = SocketServer.getInstance().getIO();
		console.warn(`⚠️ [GameEngine] Host disconnected from room ${roomId}. Starting ${HOST_GRACE_PERIOD}ms grace period.`);

		const hostId = await this.getHostId(roomId);
		if (hostId) {
			const playersKey = this.getPlayersKey(roomId);
			const rawHost = await redis.getClient().hget(playersKey, hostId);
			if (rawHost) {
				try {
					const hostP = JSON.parse(rawHost);
					hostP.connected = false;
					await redis.getClient().hset(playersKey, hostId, JSON.stringify(hostP));
				} catch {
					// ignore
				}
			}
		}

		const playerList = await this.getPlayerList(roomId);
		io.to(roomId).emit("lobby:players", playerList);

		let secondsRemaining = Math.floor(HOST_GRACE_PERIOD / 1000);
		const hostDcPayload = {
			gracePeriod: HOST_GRACE_PERIOD,
			seconds: secondsRemaining,
			message: "Host disconnected. Room will be destroyed in 30 seconds unless host reconnects.",
		};

		io.to(roomId).emit("lobby:hostDisconnected", hostDcPayload);

		// Broadcast 1-second ticks to synchronize client countdowns
		this.clearTimer(`hostGraceTick:${roomId}`);
		const tickInterval = setInterval(() => {
			secondsRemaining -= 1;
			if (secondsRemaining > 0) {
				io.to(roomId).emit("lobby:hostCountdown", { seconds: secondsRemaining });
			} else {
				this.clearTimer(`hostGraceTick:${roomId}`);
			}
		}, 1000);
		this.#activeTimers.set(`hostGraceTick:${roomId}`, tickInterval as any);

		this.clearTimer(`hostGrace:${roomId}`);
		const timer = setTimeout(async () => {
			this.clearTimer(`hostGraceTick:${roomId}`);
			console.warn(`🛑 [GameEngine] Host grace period expired for room ${roomId}. Destroying room.`);
			await this.abortGame(roomId, "HOST_LEFT");
		}, HOST_GRACE_PERIOD);

		this.#activeTimers.set(`hostGrace:${roomId}`, timer);
	}

	/**
	 * Handles player disconnection with a 30s grace period.
	 * Marks player as connected: false and removes after timeout if they do not return.
	 */
	public async handlePlayerDisconnect(roomId: string, userId: string): Promise<void> {
		const redis = RedisManager.getInstance();
		const io = SocketServer.getInstance().getIO();
		const playersKey = this.getPlayersKey(roomId);

		const rawPlayer = await redis.getClient().hget(playersKey, userId);
		if (rawPlayer) {
			try {
				const player = JSON.parse(rawPlayer) as PlayerData;
				player.connected = false;
				player.lastSeen = Date.now();
				await redis.getClient().hset(playersKey, userId, JSON.stringify(player));
			} catch {
				// ignore
			}
		}

		const playerList = await this.getPlayerList(roomId);
		io.to(roomId).emit("lobby:players", playerList);

		this.clearTimer(`playerGrace:${roomId}:${userId}`);
		const timer = setTimeout(async () => {
			const currentRaw = await redis.getClient().hget(playersKey, userId);
			if (currentRaw) {
				try {
					const p = JSON.parse(currentRaw) as PlayerData;
					if (!p.connected) {
						console.log(`[GameEngine] Player ${userId} grace expired. Removing from room ${roomId}`);
						await redis.getClient().hdel(playersKey, userId);
						io.to(roomId).emit("lobby:players", await this.getPlayerList(roomId));
					}
				} catch {
					// ignore
				}
			}
		}, PLAYER_GRACE_PERIOD);

		this.#activeTimers.set(`playerGrace:${roomId}:${userId}`, timer);
	}

	// ===================== AUTHORITATIVE GAME LOOP =====================

	/**
	 * Starts the live game loop.
	 * Acquires distributed mutex lock, verifies questions exist, broadcasts starting countdown, and advances to Question 0.
	 */
	public async startGame(roomId: string): Promise<boolean> {
		const redis = RedisManager.getInstance();
		const io = SocketServer.getInstance().getIO();

		const lockKey = this.getLockKey(roomId);
		const stateKey = this.getStateKey(roomId);
		const questionsKey = this.getQuestionsKey(roomId);

		// Check if room is aborted
		const stateRaw = await redis.getHash(stateKey);
		if (stateRaw.status === "ABORTED" || stateRaw.status === "FINISHED") {
			console.warn(`[GameEngine] Room ${roomId} cannot start: status is ${stateRaw.status}`);
			return false;
		}

		// 1. Acquire distributed lock (15s TTL mutex)
		const locked = await redis.setIfNotExists(lockKey, "1", 15000);
		if (!locked) {
			console.warn(`[GameEngine] Room ${roomId} start lock already acquired.`);
			return false;
		}

		// 2. Verify questions are loaded in Redis
		const count = await redis.listLength(questionsKey);
		if (count === 0) {
			console.error(`[GameEngine] Cannot start room ${roomId}: No questions loaded in Redis.`);
			const errPayload = { message: "No questions loaded for this room" };
			io.to(roomId).emit("game:error", errPayload);
			io.to(roomId).emit("error", errPayload);
			await redis.del(lockKey);
			return false;
		}

		// 3. Clear any lingering lobby timers
		this.clearTimer(`hostGrace:${roomId}`);
		this.clearTimer(`hostGraceTick:${roomId}`);

		// 4. Update state to COUNTDOWN
		const startTime = Date.now() + COUNTDOWN;
		await redis.setHash(stateKey, {
			status: "COUNTDOWN",
			currentQuestionIndex: -1,
			questionStartTime: startTime,
			totalQuestions: count,
		});
		await redis.expire(stateKey, 7200);

		// 5. Emit starting countdown to room
		io.to(roomId).emit("lobby:startingRoom", {
			countdown: COUNTDOWN / 1000,
			startTime,
			message: "Game starting...",
		});

		// 6. Broadcast 1-second countdown ticks
		let timeLeft = Math.floor(COUNTDOWN / 1000);
		io.to(roomId).emit("game:countdown", { timeLeft });

		const tickInterval = setInterval(() => {
			timeLeft -= 1;
			if (timeLeft > 0) {
				io.to(roomId).emit("game:countdown", { timeLeft });
			} else {
				clearInterval(tickInterval);
			}
		}, 1000);

		// 7. Arm countdown timer to advance to question 0
		this.clearTimer(`start:${roomId}`);
		const startTimer = setTimeout(async () => {
			clearInterval(tickInterval);
			await this.advanceToQuestion(roomId, 0);
		}, COUNTDOWN);

		this.#activeTimers.set(`start:${roomId}`, startTimer);
		return true;
	}

	/**
	 * Advances game state to the specified question index.
	 * Shuffles and caches option order, sanitizes question (hides correct answer), and arms 15s timer.
	 */
	private async advanceToQuestion(roomId: string, index: number): Promise<void> {
		const redis = RedisManager.getInstance();
		const io = SocketServer.getInstance().getIO();

		const stateKey = this.getStateKey(roomId);
		const questionsKey = this.getQuestionsKey(roomId);
		const stateRaw = await redis.getHash(stateKey);

		if (stateRaw.status === "FINISHED" || stateRaw.status === "ABORTED") {
			console.log(`[GameEngine] Room ${roomId} is ${stateRaw.status}. Halting question loop.`);
			return;
		}

		const questions = await redis.getList(questionsKey);
		if (index >= questions.length) {
			console.log(`[GameEngine] Reached end of questions for room ${roomId} (index: ${index}, total: ${questions.length}). Finalizing game.`);
			await this.finalizeGame(roomId);
			return;
		}

		const rawQuestionStr = questions[index];
		if (!rawQuestionStr) {
			console.error(`[GameEngine] Question at index ${index} not found for room ${roomId}`);
			await this.finalizeGame(roomId);
			return;
		}

		let rawQuestion: RawQuestion;
		try {
			rawQuestion = JSON.parse(rawQuestionStr);
		} catch (err) {
			console.error(`[GameEngine] JSON parse error for question index ${index} in room ${roomId}:`, err);
			return;
		}

		const startTime = Date.now();

		// Update state in Redis
		await redis.setHash(stateKey, {
			status: "PLAYING",
			currentQuestionIndex: index,
			questionStartTime: startTime,
			totalQuestions: questions.length,
		});
		await redis.expire(stateKey, 7200);

		// Resolve options array
		let rawOptions: string[] = [];
		if (Array.isArray(rawQuestion.Option)) {
			rawOptions = rawQuestion.Option.map((o) => o.text);
		} else if (Array.isArray(rawQuestion.options)) {
			rawOptions = rawQuestion.options.map((o) => (typeof o === "string" ? o : o.text));
		}

		// Retrieve or compute deterministic shuffled option order for this question round
		const orderKey = this.getOrderKey(roomId, index);
		let shuffledOptions: string[] = [];
		const cachedOrderRaw = await redis.getClient().get(orderKey);

		if (cachedOrderRaw) {
			try {
				shuffledOptions = JSON.parse(cachedOrderRaw);
			} catch {
				shuffledOptions = [...rawOptions].sort(() => Math.random() - 0.5);
			}
		} else {
			shuffledOptions = [...rawOptions].sort(() => Math.random() - 0.5);
			await redis.getClient().set(orderKey, JSON.stringify(shuffledOptions), "EX", 7200);
		}

		// Build sanitized client question (WITHOUT isCorrect or correct answer)
		const clientQuestion: ClientQuestion = {
			id: rawQuestion.id || String(index),
			text: rawQuestion.questionText || rawQuestion.text || "Question",
			options: shuffledOptions,
			imageUrl: rawQuestion.imageUrl,
		};

		console.log(`[GameEngine] Emitting game:questionStart for room ${roomId} (Q#${index + 1}/${questions.length})`);

		io.to(roomId).emit("game:questionStart", {
			question: clientQuestion,
			questionIndex: index,
			totalQuestions: questions.length,
			timeLimit: QUESTION_TIME / 1000,
			startTime,
		});

		// Arm 15-second question timer
		this.clearTimer(`question:${roomId}`);
		const questionTimer = setTimeout(async () => {
			await this.concludeQuestion(roomId, index);
		}, QUESTION_TIME);

		this.#activeTimers.set(`question:${roomId}`, questionTimer);
	}

	/**
	 * Concludes active question.
	 * Reveals correct answer, broadcasts Top 5 leaderboard, and arms 5s break timer before next question.
	 */
	private async concludeQuestion(roomId: string, index: number): Promise<void> {
		const redis = RedisManager.getInstance();
		const io = SocketServer.getInstance().getIO();

		const stateKey = this.getStateKey(roomId);
		const stateRaw = await redis.getHash(stateKey);

		const currentIdx = Number.parseInt(stateRaw.currentQuestionIndex || "-1", 10);
		if (currentIdx !== index || stateRaw.status !== "PLAYING") {
			console.log(`[GameEngine] State mismatch on concludeQuestion for room ${roomId} (current: ${currentIdx}, concluding: ${index}, status: ${stateRaw.status}). Skipping.`);
			return;
		}

		// Update state to BREAK
		await redis.setHashField(stateKey, "status", "BREAK");
		await redis.expire(stateKey, 7200);

		// Get question to extract correct answer
		const questionsKey = this.getQuestionsKey(roomId);
		const rawQuestionStr = await redis.getListItem(questionsKey, index);
		let correctAnswer = "";

		if (rawQuestionStr) {
			try {
				const questionObj = JSON.parse(rawQuestionStr);
				correctAnswer = this.resolveCorrectAnswer(questionObj);
			} catch (e) {
				console.error(`[GameEngine] Failed to resolve correct answer for room ${roomId} Q#${index}:`, e);
			}
		}

		const leaderboard = await this.getLeaderboard(roomId, 5);

		console.log(`[GameEngine] Concluded Q#${index} for room ${roomId}. Correct Answer: "${correctAnswer}"`);

		io.to(roomId).emit("game:questionEnd", {
			correctOptionId: correctAnswer,
			correctAnswer,
			leaderboard,
		});

		// Arm 5-second break timer
		this.clearTimer(`break:${roomId}`);
		const breakTimer = setTimeout(async () => {
			await this.advanceToQuestion(roomId, index + 1);
		}, BREAK_TIME);

		this.#activeTimers.set(`break:${roomId}`, breakTimer);
	}

	/**
	 * Submits player answer with atomic Lua script evaluation.
	 * Prevents race conditions, double-submissions, and post-question answering.
	 */
	public async submitAnswer(
		roomId: string,
		userId: string,
		answer: string,
		timeTaken: number,
	): Promise<SubmitAnswerResult> {
		const redis = RedisManager.getInstance();
		const io = SocketServer.getInstance().getIO();

		const stateKey = this.getStateKey(roomId);
		const scoresKey = this.getScoresKey(roomId);
		const playersKey = this.getPlayersKey(roomId);

		// 1. Ensure user is registered in the room
		const isMember = await redis.getClient().hexists(playersKey, userId);
		if (!isMember) {
			const playerData: PlayerData = {
				id: userId,
				username: `Player_${userId.slice(0, 4)}`,
				avatar: "avatar1.svg",
				socketId: "",
				connected: true,
				lastSeen: Date.now(),
				score: 0,
			};
			await redis.getClient().hset(playersKey, userId, JSON.stringify(playerData));
			await redis.expire(playersKey, 7200);

			const hasScore = await redis.getClient().hexists(scoresKey, userId);
			if (!hasScore) {
				await redis.getClient().hset(scoresKey, userId, "0");
				await redis.expire(scoresKey, 7200);
			}
		}

		// 2. Verify room state is PLAYING
		const stateRaw = await redis.getHash(stateKey);
		if (stateRaw.status === "ABORTED") {
			return { error: "ROOM_ABORTED", message: "Room was aborted and closed" };
		}
		if (stateRaw.status !== "PLAYING") {
			return { error: "NOT_PLAYING", message: "Game is not currently accepting answers" };
		}

		const qIndex = Number.parseInt(stateRaw.currentQuestionIndex || "0", 10);
		const questionsKey = this.getQuestionsKey(roomId);
		const rawQuestionStr = await redis.getListItem(questionsKey, qIndex);
		if (!rawQuestionStr) {
			return { error: "INVALID_QUESTION", message: "Active question not found" };
		}

		let questionObj: RawQuestion;
		try {
			questionObj = JSON.parse(rawQuestionStr);
		} catch {
			return { error: "INVALID_QUESTION_DATA", message: "Corrupted question data" };
		}

		const correctAnswer = this.resolveCorrectAnswer(questionObj);
		if (!correctAnswer) {
			return { error: "INVALID_QUESTION_SCHEMA", message: "Question has no valid correct answer configured" };
		}

		const answersKey = this.getAnswersKey(roomId, qIndex);
		const metaKey = this.getMetaKey(roomId, qIndex);

		// 3. Evaluate answer atomically via Redis Lua script
		const keys = [stateKey, scoresKey, answersKey, metaKey];
		const args = [
			userId,
			answer,
			correctAnswer,
			timeTaken,
			POINTS_CORRECT,
			POINTS_INCORRECT,
			qIndex,
		];

		const result = await redis.evalSubmitAnswer(keys, args);

		if (result.error) {
			return { error: result.error, message: result.message || result.error };
		}

		// 4. Fetch player name for live scoreboard broadcast
		const rawPlayer = await redis.getClient().hget(playersKey, userId);
		let playerName = userId;
		if (rawPlayer) {
			try {
				const p = JSON.parse(rawPlayer);
				playerName = p.username || p.name || userId;
			} catch {
				// ignore
			}
		}

		// 5. Broadcast avatar interaction to other players
		io.to(roomId).emit("game:playerAnswered", { userId });

		// 6. Broadcast live score update to room
		io.to(roomId).emit("game:scoreUpdate", {
			userId,
			score: result.newScore,
			name: playerName,
		});

		return {
			success: true,
			isCorrect: result.isCorrect,
			correctOptionText: correctAnswer,
			points: result.points,
			newScore: result.newScore,
		};
	}

	/**
	 * Finalizes the game, displays full final standings, and dispatches background persistence job.
	 */
	private async finalizeGame(roomId: string): Promise<void> {
		const redis = RedisManager.getInstance();
		const io = SocketServer.getInstance().getIO();

		this.clearAllRoomTimers(roomId);

		const stateKey = this.getStateKey(roomId);
		await redis.setHashField(stateKey, "status", "FINISHED");
		await redis.expire(stateKey, 7200);

		const results = await this.getLeaderboard(roomId);
		console.log(`🏆 [GameEngine] Game FINISHED for room ${roomId}. Final results:`, results);

		io.to(roomId).emit("game:finished", { results });

		// Dispatch BullMQ background persistence job for worker
		try {
			await QueueManager.getInstance().addGameFinishedJob(roomId);
			console.log(`📦 [GameEngine] Dispatched BullMQ game-finished job for room ${roomId}`);
		} catch (error) {
			console.error(`🔴 [GameEngine] Failed to dispatch BullMQ job for room ${roomId}:`, error);
		}

		// Release start lock after 5s safety delay
		setTimeout(async () => {
			await redis.del(this.getLockKey(roomId));
		}, 5000);
	}

	/**
	 * Aborts an active room (e.g. host leaves or manual cancel).
	 */
	public async abortGame(roomId: string, reason: string = "MANUAL"): Promise<void> {
		this.clearAllRoomTimers(roomId);

		const redis = RedisManager.getInstance();
		const io = SocketServer.getInstance().getIO();

		const stateKey = this.getStateKey(roomId);
		await redis.setHashField(stateKey, "status", "ABORTED");

		console.warn(`🛑 [GameEngine] Room ${roomId} ABORTED (Reason: ${reason})`);

		const abortPayload = {
			message: reason === "HOST_LEFT" ? "Host left the room. Room has been closed and destroyed." : "Room closed",
			reason,
			roomId,
		};
		io.to(roomId).emit("game:error", abortPayload);
		io.to(roomId).emit("error", abortPayload);
		io.to(roomId).emit("game:aborted" as any, abortPayload);
		io.to(roomId).emit("lobby:aborted" as any, abortPayload);

		// Clean up and completely destroy all Redis keys for this room
		try {
			const roomKeys = await redis.scanKeys(`room:${roomId}*`);
			if (roomKeys.length > 0) {
				await redis.del(...roomKeys);
			}
		} catch (cleanErr) {
			console.error(`Error cleaning up Redis keys for room ${roomId}:`, cleanErr);
		}
	}

	// ===================== RECOVERY & STATE SYNCHRONIZATION =====================

	/**
	 * Boot-time recovery routine. Scans all active rooms in Redis and re-arms in-memory timers.
	 * Ensures server restarts or crashes do not freeze ongoing quiz competitions.
	 */
	public async recoverActiveRooms(): Promise<void> {
		const redis = RedisManager.getInstance();
		console.log("🔄 [GameEngine] Scanning Redis for active rooms to recover...");

		try {
			const keys = await redis.scanKeys("room:*:state");
			let recoveredCount = 0;

			for (const key of keys) {
				const state = await redis.getHash(key);
				const status = state.status as GameStatus;

				if (status !== "PLAYING" && status !== "BREAK" && status !== "COUNTDOWN") {
					continue;
				}

				// Extract roomId from room:{roomId}:state
				const parts = key.split(":");
				const roomId = parts[1];
				if (!roomId) continue;

				const qIndex = Number.parseInt(state.currentQuestionIndex || "0", 10);
				const qStartTime = Number.parseInt(state.questionStartTime || "0", 10);

				console.log(`🔄 [GameEngine] Recovering room ${roomId} (Status: ${status}, Q#${qIndex})`);

				if (status === "PLAYING") {
					const elapsed = Date.now() - qStartTime;
					const remaining = QUESTION_TIME - elapsed;

					if (remaining <= 0) {
						console.log(`[GameEngine] Room ${roomId} question duration already expired. Concluding immediately.`);
						await this.concludeQuestion(roomId, qIndex);
					} else {
						console.log(`[GameEngine] Room ${roomId} re-arming question timer with ${remaining}ms remaining.`);
						this.clearTimer(`question:${roomId}`);
						const timer = setTimeout(async () => {
							await this.concludeQuestion(roomId, qIndex);
						}, remaining);
						this.#activeTimers.set(`question:${roomId}`, timer);
					}
					recoveredCount++;
				} else if (status === "BREAK") {
					console.log(`[GameEngine] Room ${roomId} in BREAK. Re-arming break timer with ${BREAK_TIME}ms.`);
					this.clearTimer(`break:${roomId}`);
					const timer = setTimeout(async () => {
						await this.advanceToQuestion(roomId, qIndex + 1);
					}, BREAK_TIME);
					this.#activeTimers.set(`break:${roomId}`, timer);
					recoveredCount++;
				} else if (status === "COUNTDOWN") {
					console.log(`[GameEngine] Room ${roomId} in COUNTDOWN. Re-advancing to question 0.`);
					this.clearTimer(`start:${roomId}`);
					const timer = setTimeout(async () => {
						await this.advanceToQuestion(roomId, 0);
					}, COUNTDOWN);
					this.#activeTimers.set(`start:${roomId}`, timer);
					recoveredCount++;
				}
			}

			console.log(`✅ [GameEngine] Active room recovery complete. Recovered ${recoveredCount} rooms.`);
		} catch (error) {
			console.error("🔴 [GameEngine] Error recovering active rooms:", error);
		}
	}

	/**
	 * Generates synchronized state payload for reconnecting or late-joining clients.
	 */
	public async getSyncPayload(
		roomId: string,
		userId: string,
	): Promise<SyncPayload | { error: string }> {
		const redis = RedisManager.getInstance();
		const stateKey = this.getStateKey(roomId);
		const stateRaw = await redis.getHash(stateKey);
		const hostId = stateRaw?.hostId || (await this.getHostId(roomId));

		if (!stateRaw || !stateRaw.status || stateRaw.status === "ABORTED" || !hostId) {
			return { error: "Room has been aborted and closed" };
		}

		const status = stateRaw.status as GameStatus;
		const qIndex = Number.parseInt(stateRaw.currentQuestionIndex || "0", 10);
		const qStartTime = Number.parseInt(stateRaw.questionStartTime || "0", 10);
		const totalQ = Number.parseInt(stateRaw.totalQuestions || "0", 10);

		// Get current player score
		const scoresKey = this.getScoresKey(roomId);
		const scoreStr = await redis.getClient().hget(scoresKey, userId);
		const myScore = Number.parseInt(scoreStr || "0", 10);

		// Check if user has already answered current question
		let alreadyAnswered = false;
		let userAnswer: string | null = null;
		if (qIndex >= 0) {
			const answersKey = this.getAnswersKey(roomId, qIndex);
			userAnswer = await redis.getClient().hget(answersKey, userId);
			alreadyAnswered = userAnswer !== null;
		}

		// Calculate timing
		let elapsedMs: number | null = null;
		let timeLeft = 0;
		if (status === "PLAYING" && qStartTime > 0) {
			elapsedMs = Date.now() - qStartTime;
			const remainingMs = Math.max(0, QUESTION_TIME - elapsedMs);
			timeLeft = Math.ceil(remainingMs / 1000);
		} else if (status === "BREAK") {
			timeLeft = 0;
		} else if (status === "COUNTDOWN") {
			const remainingMs = Math.max(0, qStartTime - Date.now());
			timeLeft = Math.ceil(remainingMs / 1000);
		}

		// Retrieve sanitized question with matching option order
		let currentQuestion: ClientQuestion | null = null;
		if ((status === "PLAYING" || status === "BREAK") && qIndex >= 0) {
			const questionsKey = this.getQuestionsKey(roomId);
			const rawQuestionStr = await redis.getListItem(questionsKey, qIndex);
			if (rawQuestionStr) {
				try {
					const rawQ = JSON.parse(rawQuestionStr) as RawQuestion;
					const orderKey = this.getOrderKey(roomId, qIndex);
					let options: string[] = [];
					const cachedOrder = await redis.getClient().get(orderKey);

					if (cachedOrder) {
						options = JSON.parse(cachedOrder);
					} else if (Array.isArray(rawQ.Option)) {
						options = rawQ.Option.map((o) => o.text);
					} else if (Array.isArray(rawQ.options)) {
						options = rawQ.options.map((o) => (typeof o === "string" ? o : o.text));
					}

					currentQuestion = {
						id: rawQ.id || String(qIndex),
						text: rawQ.questionText || rawQ.text || "Question",
						options,
						imageUrl: rawQ.imageUrl,
					};
				} catch {
					// ignore
				}
			}
		}

		const leaderboard = await this.getLeaderboard(roomId, 5);

		return {
			gameState: status,
			status,
			myScore,
			leaderboard,
			currentQuestion,
			questionIndex: qIndex,
			totalQuestions: totalQ,
			timeLeft,
			startTime: qStartTime,
			elapsedMs,
			alreadyAnswered,
			userAnswer,
		};
	}

	// ===================== HELPER METHODS =====================

	/**
	 * Computes sorted leaderboard from Redis scores and merges with player metadata.
	 */
	public async getLeaderboard(
		roomId: string,
		limit?: number,
	): Promise<LeaderboardEntry[]> {
		const redis = RedisManager.getInstance();
		const scoresKey = this.getScoresKey(roomId);
		const playersKey = this.getPlayersKey(roomId);

		const [allScores, allPlayers] = await Promise.all([
			redis.getClient().hgetall(scoresKey),
			redis.getClient().hgetall(playersKey),
		]);

		const entries: LeaderboardEntry[] = Object.entries(allScores).map(([userId, sc]) => {
			const rawPlayer = allPlayers[userId];
			let name = `Player_${userId.slice(0, 4)}`;
			let avatar = "avatar1.svg";
			let connected = true;

			if (rawPlayer) {
				try {
					const p = JSON.parse(rawPlayer);
					name = p.username || p.name || name;
					avatar = p.avatar || avatar;
					connected = p.connected ?? true;
				} catch {
					// ignore
				}
			}

			return {
				userId,
				name,
				avatar,
				score: Number.parseInt(sc || "0", 10),
				connected,
			};
		});

		entries.sort((a, b) => b.score - a.score);
		return limit ? entries.slice(0, limit) : entries;
	}

	/**
	 * Retrieves formatted player roster array for a room.
	 * Returns an array compatible with frontend lobby component (Array.isArray(data)).
	 */
	public async getPlayerList(
		roomId: string,
	): Promise<PlayerData[]> {
		const redis = RedisManager.getInstance();
		const playersKey = this.getPlayersKey(roomId);
		const rawMap = await redis.getClient().hgetall(playersKey);

		const result: PlayerData[] = [];
		for (const [userId, val] of Object.entries(rawMap)) {
			try {
				const p = JSON.parse(val);
				const username = p.username || p.name || `Player_${userId.slice(0, 4)}`;
				result.push({
					id: userId,
					name: username,
					username,
					avatar: p.avatar || "avatar1.svg",
					socketId: p.socketId || "",
					connected: p.connected ?? true,
					lastSeen: p.lastSeen || Date.now(),
					score: p.score || 0,
				});
			} catch {
				result.push({
					id: userId,
					name: `Player_${userId.slice(0, 4)}`,
					username: `Player_${userId.slice(0, 4)}`,
					avatar: "avatar1.svg",
					socketId: "",
					connected: true,
					lastSeen: Date.now(),
					score: 0,
				});
			}
		}
		return result;
	}

	/**
	 * Extracts correct answer string from question schema variations.
	 */
	public resolveCorrectAnswer(question: RawQuestion | any): string {
		if (!question) return "";

		// Option array format: { Option: [{ text: "...", isCorrect: true }] }
		if (Array.isArray(question.Option)) {
			const correctObj = question.Option.find((o: any) => o.isCorrect === true);
			if (correctObj?.text) return correctObj.text.trim();
		}

		// options array format with objects: { options: [{ text: "...", isCorrect: true }] }
		if (Array.isArray(question.options)) {
			const correctObj = question.options.find((o: any) => typeof o === "object" && o?.isCorrect === true);
			if (correctObj?.text) return correctObj.text.trim();
		}

		// Direct fields format
		if (question.correctOptionText) return String(question.correctOptionText).trim();
		if (question.correct) return String(question.correct).trim();
		if (question.correctOptionId) return String(question.correctOptionId).trim();

		return "";
	}

	/**
	 * Retrieves host ID from room state or room metadata in Redis.
	 */
	public async getHostId(roomId: string): Promise<string | null> {
		const redis = RedisManager.getInstance();
		const stateKey = this.getStateKey(roomId);
		const hostIdFromState = await redis.getClient().hget(stateKey, "hostId");
		if (hostIdFromState) return hostIdFromState;

		const roomMetaKey = `room:${roomId}`;
		return await redis.getClient().hget(roomMetaKey, "hostId");
	}

	/**
	 * Safely clears and removes a timer from active timers map.
	 */
	private clearTimer(key: string): void {
		const timer = this.#activeTimers.get(key);
		if (timer) {
			clearTimeout(timer);
			clearInterval(timer as any);
			this.#activeTimers.delete(key);
		}
	}

	/**
	 * Clears all active timers associated with a specific room.
	 */
	private clearAllRoomTimers(roomId: string): void {
		const prefixes = [
			`start:${roomId}`,
			`question:${roomId}`,
			`break:${roomId}`,
			`hostGrace:${roomId}`,
			`hostGraceTick:${roomId}`,
		];

		for (const key of prefixes) {
			this.clearTimer(key);
		}

		for (const [key] of this.#activeTimers) {
			if (key.includes(roomId)) {
				this.clearTimer(key);
			}
		}
	}
}

export default GameEngine;