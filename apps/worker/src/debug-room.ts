import { prisma } from "@repo/db";
import { Redis } from "ioredis";

// Copying Redis logic from worker.ts to ensure exact match
const connection = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, { 
      maxRetriesPerRequest: null, 
      enableReadyCheck: false,
      family: 4 
    })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null, 
      enableReadyCheck: false,
      family: 4
    });

async function debugRoom(roomId: string) {
    console.log(`\n --- DEBUGGING ROOM: ${roomId} ---\n`);

    const roomKey = `room:${roomId}`;

    // 1. Check Redis Connection
    try {
        await connection.ping();
        console.log(" Redis Connected");
    } catch (e) {
        console.error(" Redis Connection Failed", e);
        process.exit(1);
    }

    // 2. Check DB Room
    console.log("\n--- DATABASE CHECK ---");
    const room = await prisma.room.findFirst({
        where: { OR: [{ roomName: roomId }, { id: roomId }] },
        include: { questions: { orderBy: { questionOrder: 'asc' } } }
    });

    if (!room) {
        console.error(" Room NOT found in Database!");
    } else {
        console.log(` Room Found: ${room.roomName} (${room.id})`);
        console.log(`   State: ${room.state}`);
        console.log(`   Questions in DB: ${room.questions.length}`);
    }

    // 3. Check Redis Data
    console.log("\n--- REDIS CHECK ---");
    
    // Check Questions
    const questionsLen = await connection.llen(`${roomKey}:questions`);
    console.log(` Key '${roomKey}:questions': Length = ${questionsLen}`);

    // Check Answers
    if (room && room.questions.length > 0) {
        for (const [index, rq] of room.questions.entries()) {
            const answersKey = `${roomKey}:answers:${index}`;
            const metaKey = `${roomKey}:answers_meta:${index}`;
            
            const exists = await connection.exists(answersKey);
            const count = await connection.hlen(answersKey);
            
            console.log(`   Q${index} (${rq.questionId})`);
            console.log(`       Key: ${answersKey} -> Exists: ${exists ? 'YES' : 'NO'}, Count: ${count}`);
            
            if (exists) {
                const data = await connection.hgetall(answersKey);
                console.log(`       Data:`, data);
            }
        }
    } else {
        // Fallback checks if DB is empty
        console.log("   (Checking raw indices 0-5 since DB questions missing)");
        for(let i=0; i<5; i++) {
            const k = `${roomKey}:answers:${i}`;
            const c = await connection.hlen(k);
            console.log(`       ${k} -> Count: ${c}`);
        }
    }

    console.log("\n-------------------------");
    process.exit(0);
}

const roomIdArg = process.argv[2];
if (!roomIdArg) {
    console.error("Please provide a RoomID or RoomName as argument");
    process.exit(1);
}

debugRoom(roomIdArg);
