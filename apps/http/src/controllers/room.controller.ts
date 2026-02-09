import { prisma } from "@repo/db";
import { Request, Response } from "express";
import { redisClient } from "@repo/redis";

export const createRoom = async (req: Request, res: Response) => {
  const { hostId, roomName, quizId } = req.body;
  console.log(hostId, roomName, quizId);

  try {
    const room = await prisma.room.create({
      data: {
        roomName,
        maxPlayers: 10,
        state: "CREATED",

        // 🔗 RELATIONS
        host: {
          connect: { id: hostId }, // connects Room → User
        },
        quiz: {
          connect: { id: quizId }, // connects Room → Quiz
        },

        // name: roomNa me,
      },
    });
    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      // data: room,
    });
  } catch (error: any) {
    console.error("Room creation error:", error);

    // Prisma FK error
    if (error.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Invalid host user",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getRoom = async (req: Request, res: Response) => {
  const roomId = Array.isArray(req.params.roomId)
    ? req.params.roomId[0]
    : req.params.roomId;

  const room = await prisma.room.findUnique({
    where: { roomName: roomId },
    // select: { id: true, hostId: true, state: true },
  });
  console.log("room data", room);
  return res.status(200).json({
    success: true,

    message: "Success at Getting room",
    room,
  });
};

export const getRoomResult = async (req: Request, res: Response) => {
  const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  
  try {
      // Fetch Room with details
      const room = await prisma.room.findFirst({
          where: { OR: [{ roomName: roomId }, { id: roomId }] },
          include: {
              players: { orderBy: { score: 'desc' }, include: { user: true } },
              questions: {
                   orderBy: { questionOrder: 'asc' },
                   // We need the actual Question text etc.
                   // RoomQuestion has questionId.
              }
          }
      });
      
      if (!room) return res.status(404).json({ success: false, message: "Room not found" });

      // Fetch actual Question details
      const questionIds = room.questions.map(rq => rq.questionId);
      const questionsData = await prisma.question.findMany({
          where: { id: { in: questionIds } },
          include: { Option: true }
      });
      const questionMap = new Map(questionsData.map(q => [q.id, q]));

      // Fetch Answers
      const answers = await prisma.playerAnswer.findMany({
          where: { roomId: room.id },
          include: { user: true }
      });

      // Construct Result Payload
      const detailedResults = room.players.map(p => {
          const userAnswers = (answers as any[]).filter(a => a.userId === p.userId);
          
          const answersDetails = (room.questions as any[]).map(rq => {
              const qData = questionMap.get(rq.questionId);
              const userAnswer = userAnswers.find(a => a.roomQuestionId === rq.id);
              const correctOption = qData?.Option.find((o: any) => o.isCorrect);
              const selectedOption = qData?.Option.find((o: any) => o.id === userAnswer?.selectedOptionId);
              
              return {
                  questionText: qData?.questionText,
                  correctOptionText: correctOption?.text,
                  selectedOptionText: selectedOption?.text || "Skipped",
                  isCorrect: userAnswer?.isCorrect || false,
                  points: (userAnswer as any)?.pointsEarned || 0
              };
          });

          return {
              user: p.user,
              score: p.score,
              rank: 0,
              answers: answersDetails
          };
      });

      return res.status(200).json({
          success: true,
          roomName: room.roomName,
          results: detailedResults
      });

  } catch (error) {
      console.error("Get Room Result Error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateLobby = async (req: Request, res: Response) => {
  const roomId = Array.isArray(req.params.roomId)
    ? req.params.roomId[0]
    : req.params.roomId;

  const { hostId } = req.body;
  console.log(roomId);

  try {
    const room = await prisma.room.findUnique({
      where: { roomName: roomId },
      select: { id: true, hostId: true, state: true },
    });
    console.log("room", room);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // 🔒 Only host can move to lobby
    if (room.hostId !== hostId) {
      return res.status(403).json({
        success: false,
        message: "Only host can update room",
      });
    }

    // 🚫 Already in lobby
    if (room.state === "WAITING") {
      return res.status(200).json({
        success: true,
        message: "Room already in lobby",
      });
    }

    // 🚫 Cannot go back from finished
    if (room.state === "FINISHED") {
      return res.status(400).json({
        success: false,
        message: "Game already finished",
      });
    }

    // ✅ Move to lobby
    const updatedRoom = await prisma.room.update({
      where: { roomName: roomId },
      data: {
        state: "WAITING",
      },
    });

    // 📝 Log event
    await prisma.roomEvent.create({
      data: {
        roomId: room.id, // ✅ correct FK
        userId: hostId,
        eventType: "ROOM_MOVED_TO_LOBBY",
        payload: {},
      },
    });

    return res.status(200).json({
      success: true,
      message: "Room is now in lobby",
      data: updatedRoom,
    });
  } catch (error) {
    console.error("Lobby update error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const startRoom = async (req: Request, res: Response) => {
    const roomId = Array.isArray(req.params.roomId) 
      ? req.params.roomId[0] 
      : req.params.roomId;
console.log("room Id",roomId)
    if (!roomId) {
      return res.status(400).json({ success: false, message: "Invalid Room ID" });
    }

 try {
   // 1. Fetch Room Data
    const room = await prisma.room.findFirst({
      where: { 
        OR: [
            { roomName: roomId },
            { id: roomId }
        ]
      },
      include: {
        quiz: {
          include: {
            Question: {
              include: { Option: true },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        players: true,
      },
    });

    console.log("Fetched room details", room)

     if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // 2. Initialize Redis Data
    const roomKey = `room:${roomId}`;
    
    // 🔥 SYNC: Fetch players from LOBBY (Redis) and ensure they are in DB
    console.log(`📝 [RoomController] Reading players from Redis Key: ${roomKey}:players`);
    const lobbyPlayers = await redisClient.hgetall(`${roomKey}:players`);
    console.log(`📝 [RoomController] Found ${Object.keys(lobbyPlayers).length} players in Redis`);
    
    const playersToSync = Object.entries(lobbyPlayers).map(([userId, dataStr]) => {
        let parsed: any = {};
        try {
            parsed = JSON.parse(dataStr);
        } catch (e) {
            console.error("Failed to parse player data from Redis", e);
        }
        
        return {
            userId,
            roomId: room.id,
            usernameSnapshot: parsed.username || "Unknown Player",
            avatarSnapshot: parsed.avatar || "avatar1.svg",
            score: 0,
            hasJoinedGame: true,
            gameJoinedAt: new Date()
        };
    });

    if (playersToSync.length > 0) {
        await prisma.roomPlayer.createMany({
            data: playersToSync,
            skipDuplicates: true, // If already in DB, ignore
        });
        console.log(`Synced ${playersToSync.length} players from Redis to DB`);
    }


    // Set Game State
    await redisClient.hset(`${roomKey}:state`, {
      status: "COUNTDOWN",
      currentQuestionIndex: -1,
      startTime: Date.now(),
    });
    await redisClient.expire(`${roomKey}:state`, 3600); // 🛡️ TTL

    // Push Questions
    const questions = room.quiz.Question.map((q) => JSON.stringify(q));
    if (questions.length > 0) {
      console.log(`📝 [RoomController] Pushing ${questions.length} questions to Redis for ${roomId}`);
      await redisClient.del(`${roomKey}:questions`);
      await redisClient.rpush(`${roomKey}:questions`, ...questions);
      await redisClient.expire(`${roomKey}:questions`, 3600); // 🛡️ TTL
      
      // 🔥 CLEANUP: Remove old answers
      const oldAnswerKeys = await redisClient.keys(`${roomKey}:answers:*`);
      if (oldAnswerKeys.length > 0) {
          await redisClient.del(oldAnswerKeys);
      }

      // 🔥 DB SYNC: Create RoomQuestion records for persistent results
      const roomQuestionsData = room.quiz.Question.map((q: any, index: number) => ({
          roomId: room.id,
          questionId: q.id,
          questionOrder: index
      }));
      
      // Clear old room questions if restarting (optional but good for safety)
      await prisma.roomQuestion.deleteMany({ where: { roomId: room.id } });
      
      await prisma.roomQuestion.createMany({
          data: roomQuestionsData
      });
      console.log(`✅ [RoomController] Created ${roomQuestionsData.length} RoomQuestion records`);

    } else {
        console.warn(`⚠️ [RoomController] No questions found for quiz ${room.quiz.id} in room ${roomId}`);
        return res.status(400).json({ success: false, message: "Quiz has no questions! Cannot start." });
    }
    
    // Initialize Scores (Use synced players from Redis)
    const playerScores: Record<string, string> = {};
    
    // Use the list from Redis to ensure everyone in lobby is included
    Object.keys(lobbyPlayers).forEach((userId) => {
      playerScores[userId] = "0";
    });
    
    // Also include anyone already in DB (host, etc) just in case
    room.players.forEach((p) => {
        if(!playerScores[p.userId]) playerScores[p.userId] = "0";
    });

    if (Object.keys(playerScores).length > 0) {
      await redisClient.hset(`${roomKey}:scores`, playerScores);
      await redisClient.expire(`${roomKey}:scores`, 3600); // 🛡️ TTL
    }
    // 3. Update DB State
    await prisma.room.update({
      where: { id: room.id }, // ✅ Use ID (UUID) from fetched room for safety
      data: { state: "COUNTDOWN", startedAt: new Date() },
    });
    return res.status(200).json({ success: true, message: "Game starting", synced: playersToSync.length });
  
 } catch (error) {
    console.error("Start room error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  
 }
  
}

export const finalizeRoom = async (req: Request, res: Response) => {
  const roomId = Array.isArray(req.params.roomId)
    ? req.params.roomId[0]
    : req.params.roomId;

    if (!roomId) {
      return res.status(400).json({ success: false, message: "Invalid Room ID" });
    }
  const roomKey = `room:${roomId}`;

  try {
    // 1. Get Final Scores from Redis
    const scores = await redisClient.hgetall(`${roomKey}:scores`);

    // Fetch Room Data (Need ID)
    const room = await prisma.room.findUnique({ 
        where: { roomName: roomId },
        include: { questions: { orderBy: { questionOrder: 'asc' } } }
    }) as any;
    if (!room) throw new Error("Room not found");

    // 2. Update Player Scores in DB
    const updates = Object.entries(scores).map(async ([userId, score]) => {
      return prisma.roomPlayer.updateMany({
        where: { roomId: room.id, userId },
        data: { score: parseInt(score) },
      });
    });
    await Promise.all(updates);
    
    // 3. 🔥 SAVE PLAYER ANSWERS
    const roomQuestions = room.questions;
    const playerAnswersToCreate: any[] = [];
    
    // FETCH Questions separately to map options
    const questionsData = await prisma.question.findMany({
        where: { id: { in: (roomQuestions as any[]).map((rq: any) => rq.questionId) } },
        include: { Option: true }
    });
    
    const questionMap = new Map(questionsData.map(q => [q.id, q]));

    for (const [index, rq] of (roomQuestions as any[]).entries()) {
         const answersMap = await redisClient.hgetall(`${roomKey}:answers:${index}`);
         const fullQuestion = questionMap.get(rq.questionId);
         
         if (!fullQuestion) continue;
         
         for (const [userId, selectedText] of Object.entries(answersMap)) {
             const selectedOption = fullQuestion.Option.find(o => o.text === selectedText);
             const correctOption = fullQuestion.Option.find(o => o.isCorrect);
             
             const isCorrect = selectedText === correctOption?.text; 
             
             playerAnswersToCreate.push({
                 roomId: room.id,
                 roomQuestionId: rq.id,
                 userId,
                 selectedOptionId: selectedOption?.id || "unknown",
                 isCorrect,
                 pointsEarned: isCorrect ? 4 : -1,
                 responseTimeMs: 0 
             });
         }
    }
    
    if (playerAnswersToCreate.length > 0) {
        await prisma.playerAnswer.createMany({
            data: playerAnswersToCreate,
            skipDuplicates: true
        });
        console.log(`✅ Saved ${playerAnswersToCreate.length} player answers to DB`);
    }


    // 4. Mark Room as Finished
    await prisma.room.update({
      where: { id: room.id },
      data: { state: "FINISHED", endedAt: new Date() },
    });

    // 5. Cleanup Redis (expire in 1 hour)
    await redisClient.expire(`${roomKey}:state`, 3600);
    await redisClient.expire(`${roomKey}:questions`, 3600);
    await redisClient.expire(`${roomKey}:scores`, 3600);
    // Expire answer keys too
    const answerKeys = await redisClient.keys(`${roomKey}:answers:*`);
    for(const k of answerKeys) {
        await redisClient.expire(k, 3600);
    }
    
    // 🔥 UNLOCK (Allow restart after delay or immediately)
    await redisClient.del(`${roomKey}:loop_lock`);

    return res.status(200).json({ success: true, message: "Game finalized" });
  } catch (error) {
    console.error("Finalize game error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};