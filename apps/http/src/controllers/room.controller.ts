import { prisma } from "@repo/db";
import { Request, Response } from "express";

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

export const getRoom = (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Success at Getting room",
  });
};

export const getRoomResult = (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Success at Getting Result of  room",
  });
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
      select: { id: true,hostId: true, state: true },
    });
    console.log("room", room)

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
