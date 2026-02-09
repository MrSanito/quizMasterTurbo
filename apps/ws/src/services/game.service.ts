
import { redisClient } from "@repo/redis";
import { Server } from "socket.io";

const QUESTION_TIME = 15; // seconds
const BREAK_TIME = 5; // seconds

export async function joinGame(roomId: string, userId: string) {
  const roomKey = `room:${roomId}`;

  // 1. Check Game State
  const stateData = await redisClient.hgetall(`${roomKey}:state`);
  if (!stateData || !stateData.status) {
    return { error: "Room not active" };
  }

  // 2. Get Score (Use Hexists to distinguish 0 from null/missing)
  console.log(`🔍 Checking participant: ${roomKey}:scores for ${userId}`);
  const isParticipant = await redisClient.hexists(`${roomKey}:scores`, userId);
  console.log(`🔍 Is User ${userId} a participant? ${isParticipant}`);
  
  if (!isParticipant) {
    // Debug: Print all scores to see who IS there
    const allScores = await redisClient.hgetall(`${roomKey}:scores`);
    console.log("🔍 Current Participants:", allScores);
    return { error: "User is not a participant in this game" };
  }

  const score = await redisClient.hget(`${roomKey}:scores`, userId);

  // 3. Construct Payload
  // Fetch existing state
  // Also fetch my player details to ensure client has them? (Client usually has its own user context, but good for sync)
  
  let payload: any = {
    gameState: stateData.status,
    myScore: parseInt(score || "0"),
  };

  if (stateData.status === "PLAYING") {
    // Return current Question & Time Left
    const qIndex = parseInt(stateData.currentQuestionIndex || "0");
    const questions = await redisClient.lrange(`${roomKey}:questions`, 0, -1);
    
    const questionStr = questions[qIndex];
    if (questionStr) {
        const currentQ = JSON.parse(questionStr as string);
        // Hide correct answer!
        const { correct, Option, ...safeQuestion } = currentQ; // removing correct answer
        const options = Option ? Option.map((o: any) => o.text) : (currentQ.options || []);
        
        // Calculate Time Left
        const questionStartTime = parseInt(stateData.questionStartTime || "0");
        const elapsed = (Date.now() - questionStartTime) / 1000;
        const timeLeft = Math.max(0, QUESTION_TIME - elapsed);

        // Check if user already answered
        const myAnswer = await redisClient.hget(`${roomKey}:answers:${qIndex}`, userId);

        payload.currentQuestion = {
            ...safeQuestion,
            text: currentQ.questionText || currentQ.text,
            options
        };
        payload.timeLeft =  Math.round(timeLeft);
        payload.startTime = questionStartTime; // 🔥 Send exact start time for accurate sync
        
        if (myAnswer) {
            payload.userAnswer = myAnswer;
        }

        // Add Progress Info
        payload.questionIndex = qIndex;
        payload.totalQuestions = questions.length;
    }
  }

  return payload;
}


// --- THE GAME LOOP ---

export async function startGameLoop(roomId: string, io: Server) {
    const roomKey = `room:${roomId}`;
    
    console.log(`\n\n🎬 ============ STARTING GAME LOOP ============`);
    console.log(`🎬 Room ID: ${roomId}`);
    
    // 0. CHECK IF QUESTIONS EXIST
    const questionCount = await redisClient.llen(`${roomKey}:questions`);
    console.log(`🎬 Question Count in Redis: ${questionCount}`);

    if (questionCount === 0) {
        console.error(`❌ [GameService] No questions found for room ${roomId}. Aborting loop.`);
        io.to(roomId).emit("error", { message: "Game Error: No questions loaded." });
        return;
    }

    // Server-side Countdown (5 seconds)
    let countdown = 5;
    
    const interval = setInterval(async () => {
        try {
            if (countdown > 0) {
                // Emit countdown to all players
                io.to(roomId).emit("game:countdown", { timeLeft: countdown });
                console.log(`⏳ Countdown ${roomId}: ${countdown}`);
                countdown--;
            } else {
                clearInterval(interval);
                // Start Question 1
                console.log(`🎬 Countdown finished. Starting Question 0...`);
                await nextQuestion(roomId, io, 0);
            }
        } catch (e) {
            console.error("❌ Error in Game Loop:", e);
            clearInterval(interval);
        }
    }, 1000);
}


async function nextQuestion(roomId: string, io: Server, index: number) {
    console.log(`➡️ [nextQuestion] Called for Room: ${roomId}, Index: ${index}`);
    const roomKey = `room:${roomId}`;

    // 1. Get Questions
    let questions;
    try {
        questions = await redisClient.lrange(`${roomKey}:questions`, 0, -1);
        console.log(`📝 [GameService] Loaded ${questions.length} questions for ${roomId}`);
    } catch(err) {
        console.error("❌ Failed to load questions from Redis", err);
        return;
    }
    
    // CHECK: End of Game?
    if (index >= questions.length) {
        console.log(`🏁 No more questions (Index ${index} >= ${questions.length}). Finishing game.`);
        await finishGame(roomId, io);
        return;
    }

    // 2. Load Question
    let question;
    try {
        const questionStr = questions[index];
        if (!questionStr) throw new Error("Question not found");
        question = JSON.parse(questionStr as string);
        console.log(`📝 [GameService] Parsed Question ${index}:`, question.id);
    } catch (err) {
        console.error("❌ Failed to parse question JSON", err);
        return;
    }

    // 3. Update State (PLAYING)
    try {
        await redisClient.hset(`${roomKey}:state`, {
            status: "PLAYING",
            currentQuestionIndex: index,
            questionStartTime: Date.now()
        });
        console.log(`✅ [GameService] Updated State to PLAYING`);
    } catch(err) {
        console.error("❌ Failed to update Redis state", err);
    }

    // 4. Emit Question
    const { correct, Option, ...safeQuestion } = question; // Safety first!
    
    // Map options to simple string array if needed
    let options = Option ? Option.map((o: any) => o.text) : (question.options || []);
    
    // Shuffle options to randomize order
    options = options.sort(() => Math.random() - 0.5);

    console.log(`📢 [GameService] Emitting Question Start to room ${roomId}`);
    io.to(roomId).emit("game:questionStart", {
        question: {
            ...safeQuestion,
            text: question.questionText || question.text, // Handle both field names
            options 
        },
        questionIndex: index,
        totalQuestions: questions.length,
        timeLimit: QUESTION_TIME,
        startTime: Date.now() // 🔥 Sync Timer
    });

    // 5. Start Tick Loop (Optional, or just one timeout)
    // We'll use a simple timeout for the question duration
    console.log(`⏱️ Question Timer set for ${QUESTION_TIME}s`);
    setTimeout(() => endQuestion(roomId, io, index, question), QUESTION_TIME * 1000);
}


async function endQuestion(roomId: string, io: Server, index: number, question: any) {
    const roomKey = `room:${roomId}`;
    console.log(`🛑 Ending Question ${index} for room ${roomId}`);
    
    // 1. Update State (WAITING/BREAK)
    await redisClient.hset(`${roomKey}:state`, { status: "BREAK" });

    // 2. Calculate Leaderboard (Top 5)
    // Fetch Scores
    const scores = await redisClient.hgetall(`${roomKey}:scores`);
    // Fetch Player Details
    const playersData = await redisClient.hgetall(`${roomKey}:players`);

    const leaderboard = Object.entries(scores)
        .map(([userId, score]) => {
            const playerStr = playersData[userId];
            const pData = playerStr ? JSON.parse(playerStr as string) : {};
            return {
                userId,
                score: parseInt(score || "0"),
                name: pData.username || pData.name || userId,
                avatar: pData.avatar
            };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    // 3. Emit Result (Correct Answer & Leaderboard)
    const correctOption = question.Option?.find((o: any) => o.isCorrect);
    const correctText = correctOption ? correctOption.text : (question.correct || question.correctOptionId);

    console.log(`📢 Emitting result. Correct: ${correctText}`);
    io.to(roomId).emit("game:questionEnd", {
        correctOptionId: correctText, 
        leaderboard
    });

    // 4. Schedule Next Question
    console.log(`⏱️ Break Timer set for ${BREAK_TIME}s`);
    setTimeout(() => nextQuestion(roomId, io, index + 1), BREAK_TIME * 1000);
}


async function finishGame(roomId: string, io: Server) {
    const roomKey = `room:${roomId}`;

    // 1. Update State
    await redisClient.hset(`${roomKey}:state`, { status: "FINISHED" });

    // 2. Final Leaderboard
    const scores = await redisClient.hgetall(`${roomKey}:scores`);
    const playersData = await redisClient.hgetall(`${roomKey}:players`);

    const leaderboard = Object.entries(scores)
        .map(([userId, score]) => {
            const playerStr = playersData[userId];
            const pData = playerStr ? JSON.parse(playerStr as string) : {};
            return {
                userId,
                score: parseInt(score || "0"),
                name: pData.username || pData.name || userId,
                avatar: pData.avatar
            };
        })
        .sort((a, b) => b.score - a.score);

    // 3. Emit Finish
    io.to(roomId).emit("game:finished", { results: leaderboard });

    // 4. Trigger HTTP API to save (Optional, or wait for host)
    console.log(`🏁 Game ${roomId} finished!`);
}


// --- USER ACTIONS ---

export async function submitAnswer(io: Server, data: { roomId: string; userId: string; answer: string; timeTaken: number }) {
    const { roomId, userId, answer } = data;
    const roomKey = `room:${roomId}`;

    // 1. Get Current State
    const state = await redisClient.hgetall(`${roomKey}:state`);
    if (state.status !== "PLAYING") {
        throw new Error("Game is not in playing state");
    }

    // 2. Validate Participant
    const isParticipant = await redisClient.hexists(`${roomKey}:scores`, userId);
    if (!isParticipant) {
        throw new Error("User is not a participant");
    }

    // 3. Get Question
    const index = parseInt((state.currentQuestionIndex as string) || "0");
    const questions = await redisClient.lrange(`${roomKey}:questions`, 0, -1);
    const questionStr = questions[index];
    if (!questionStr) {
        throw new Error("Question not found at index");
    }
    const question = JSON.parse(questionStr as string);

    // 3. Check Protocol
    // Prevent double answer? (Optional: use set)
    const hasAnswered = await redisClient.hexists(`${roomKey}:answers:${index}`, userId);
    if (hasAnswered) {
         return { error: "Already answered" };
    }

    // 4. Grade
    // Schema uses Option[] with isCorrect boolean
    // We need to find the text of the correct option
    const correctOption = question.Option?.find((o: any) => o.isCorrect);
    const correctText = correctOption ? correctOption.text : (question.correct || question.correctOptionId);

    const isCorrect = correctText === answer;
    const points = isCorrect ? 4 : -1; // +4 for correct, -1 for incorrect

    // 5. Update Score
    await redisClient.hincrby(`${roomKey}:scores`, userId, points);
    await redisClient.hset(`${roomKey}:answers:${index}`, userId, answer);

    const newScore = await redisClient.hget(`${roomKey}:scores`, userId);
    
    // 🔥 Emit Live Score Update
    io.to(roomId).emit("game:scoreUpdate", {
        userId,
        score: parseInt((newScore as string) || "0")
    });

    // 6. Return Result (for private emit)
    return {
        isCorrect,
        points,
        newScore
    };
}