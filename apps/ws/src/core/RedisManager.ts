import { Redis } from "ioredis";
import { redisClient } from "@repo/redis";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INLINE_SUBMIT_ANSWER_LUA = `
local stateKey = KEYS[1]
local scoresKey = KEYS[2]
local answersKey = KEYS[3]
local metaKey = KEYS[4]

local userId = ARGV[1]
local submittedAnswer = ARGV[2]
local correctAnswer = ARGV[3]
local timeTaken = ARGV[4]
local correctPoints = tonumber(ARGV[5]) or 4
local incorrectPoints = tonumber(ARGV[6]) or -1
local expectedQIndex = ARGV[7]

local status = redis.call('HGET', stateKey, 'status')
if not status or status ~= 'PLAYING' then
    return cjson.encode({ error = 'NOT_PLAYING', message = 'Game is not in PLAYING state' })
end

if expectedQIndex and expectedQIndex ~= '' then
    local currentQIndex = redis.call('HGET', stateKey, 'currentQuestionIndex')
    if currentQIndex and tostring(currentQIndex) ~= tostring(expectedQIndex) then
        return cjson.encode({ error = 'QUESTION_CLOSED', message = 'Question has already concluded' })
    end
end

local alreadyAnswered = redis.call('HEXISTS', answersKey, userId)
if alreadyAnswered == 1 then
    return cjson.encode({ error = 'ALREADY_ANSWERED', message = 'Answer already submitted for this question' })
end

local isCorrect = (submittedAnswer == correctAnswer)
local pointsToAdd = isCorrect and correctPoints or incorrectPoints

redis.call('HINCRBY', scoresKey, userId, pointsToAdd)
redis.call('HSET', answersKey, userId, submittedAnswer)
if metaKey and metaKey ~= '' then
    redis.call('HSET', metaKey, userId, tostring(timeTaken))
end

local newScore = redis.call('HGET', scoresKey, userId)

return cjson.encode({
    success = true,
    isCorrect = isCorrect,
    correctAnswer = correctAnswer,
    points = pointsToAdd,
    newScore = tonumber(newScore) or 0
})
`;

export class RedisManager {
	private static instance: RedisManager | null = null;
	private client: Redis;
	private submitAnswerSha: string | null = null;

	private constructor() {
		this.client = redisClient as Redis;
		this.client.on("connect", () => {
			console.log("🟢 [RedisManager] Redis connected");
		});
		this.client.on("error", (err: any) => {
			console.error("🔴 [RedisManager] Redis error:", err);
		});
	}

	public static getInstance(): RedisManager {
		if (!RedisManager.instance) {
			RedisManager.instance = new RedisManager();
		}
		return RedisManager.instance;
	}

	public getClient(): Redis {
		return this.client;
	}

	/**
	 * Pre-loads Lua scripts into Redis script cache to get SHA digests for high-performance EVALSHA execution
	 */
	public async loadLuaScripts(): Promise<void> {
		try {
			let scriptContent = INLINE_SUBMIT_ANSWER_LUA;
			const scriptPath = path.resolve(__dirname, "../lua/submit_answer.lua");
			if (fs.existsSync(scriptPath)) {
				scriptContent = fs.readFileSync(scriptPath, "utf-8");
			}

			this.submitAnswerSha = (await this.client.script(
				"LOAD",
				scriptContent,
			)) as string;
			console.log(
				`⚡ [RedisManager] Loaded submit_answer.lua (SHA: ${this.submitAnswerSha})`,
			);
		} catch (error) {
			console.warn(
				"⚠️ [RedisManager] Could not pre-load Lua script from file, will use inline fallback evaluation",
				error,
			);
		}
	}

	public getSubmitAnswerSha(): string | null {
		return this.submitAnswerSha;
	}

	/**
	 * Atomic answer submission evaluation using EVALSHA with fallback to EVAL
	 */
	public async evalSubmitAnswer(
		keys: string[],
		args: (string | number)[],
	): Promise<any> {
		const strArgs = args.map((a) => (a !== undefined && a !== null ? String(a) : ""));
		let rawResult: string;

		try {
			if (this.submitAnswerSha) {
				rawResult = (await this.client.evalsha(
					this.submitAnswerSha,
					keys.length,
					...keys,
					...strArgs,
				)) as string;
			} else {
				rawResult = (await this.client.eval(
					INLINE_SUBMIT_ANSWER_LUA,
					keys.length,
					...keys,
					...strArgs,
				)) as string;
			}
		} catch (err: any) {
			// If NOSCRIPT error, re-load and retry with EVAL
			if (err?.message?.includes("NOSCRIPT")) {
				rawResult = (await this.client.eval(
					INLINE_SUBMIT_ANSWER_LUA,
					keys.length,
					...keys,
					...strArgs,
				)) as string;
			} else {
				throw err;
			}
		}

		try {
			return JSON.parse(rawResult);
		} catch {
			return { error: "INVALID_LUA_RESPONSE", raw: rawResult };
		}
	}

	// ===================== HIGH-LEVEL REDIS HELPERS =====================

	public async getHash(key: string): Promise<Record<string, string>> {
		return (await this.client.hgetall(key)) || {};
	}

	public async setHash(
		key: string,
		data: Record<string, string | number | boolean>,
	): Promise<void> {
		const formatted: Record<string, string> = {};
		for (const [k, v] of Object.entries(data)) {
			if (v !== undefined && v !== null) {
				formatted[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
			}
		}
		if (Object.keys(formatted).length > 0) {
			await this.client.hset(key, formatted);
		}
	}

	public async setHashField(
		key: string,
		field: string,
		value: string | number | boolean,
	): Promise<void> {
		await this.client.hset(key, field, String(value));
	}

	public async getHashField(
		key: string,
		field: string,
	): Promise<string | null> {
		return await this.client.hget(key, field);
	}

	public async getList(key: string): Promise<string[]> {
		return await this.client.lrange(key, 0, -1);
	}

	public async getListItem(
		key: string,
		index: number,
	): Promise<string | null> {
		return await this.client.lindex(key, index);
	}

	public async listLength(key: string): Promise<number> {
		return await this.client.llen(key);
	}

	public async zsetTopN(
		key: string,
		limit: number = 10,
	): Promise<{ userId: string; score: number }[]> {
		// Try ZREVRANGE WITHSCORES first (in case scores are stored in ZSET)
		const type = await this.client.type(key);
		if (type === "zset") {
			const results = await this.client.zrevrange(key, 0, limit - 1, "WITHSCORES");
			const leaderboard: { userId: string; score: number }[] = [];
			for (let i = 0; i < results.length; i += 2) {
				const userId = results[i];
				const score = Number.parseInt(results[i + 1] || "0", 10);
				if (userId) {
					leaderboard.push({ userId, score });
				}
			}
			return leaderboard;
		}

		// Fallback: If stored in HASH, fetch all and sort
		const allScores = await this.client.hgetall(key);
		const entries = Object.entries(allScores).map(([userId, scoreStr]) => ({
			userId,
			score: Number.parseInt(scoreStr || "0", 10),
		}));
		entries.sort((a, b) => b.score - a.score);
		return entries.slice(0, limit);
	}

	/**
	 * Non-blocking key scanner using SCAN streams instead of blocking KEYS command
	 */
	public async scanKeys(pattern: string): Promise<string[]> {
		return new Promise((resolve, reject) => {
			const stream = this.client.scanStream({
				match: pattern,
				count: 100,
			});
			const keys: string[] = [];
			stream.on("data", (resultKeys: string[]) => {
				keys.push(...resultKeys);
			});
			stream.on("end", () => {
				resolve(keys);
			});
			stream.on("error", (err) => {
				reject(err);
			});
		});
	}

	public async setIfNotExists(
		key: string,
		value: string | number = "1",
		expireMs: number = 15000,
	): Promise<boolean> {
		const result = await this.client.set(key, String(value), "PX", expireMs, "NX");
		return result === "OK";
	}

	public async del(...keys: string[]): Promise<number> {
		if (keys.length === 0) return 0;
		return await this.client.del(...keys);
	}

	public async expire(key: string, seconds: number): Promise<number> {
		return await this.client.expire(key, seconds);
	}
}

export default RedisManager;