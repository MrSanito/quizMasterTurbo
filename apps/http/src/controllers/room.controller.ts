import { prisma } from "@repo/db";
import { Request, Response } from "express";

export const createRoom = async (req: Request, res: Response) => {
  const {hostId, roomName} = req.body;
  console.log(hostId, roomName)

  try {
    // const room = await prisma.room.create({
    //   data: {
    //     hostId: "hai kuch to hai ",
    //     maxPlayers: 3,
    //     state: "CREATED",
    //   },
    // });
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
