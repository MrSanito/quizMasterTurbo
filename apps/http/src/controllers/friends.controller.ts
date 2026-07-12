import { Request, Response } from "express";
import { prisma } from "@repo/db";

// GET /api/friends
export const getFriends = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const friendships = await prisma.friend.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        User_Friend_senderIdToUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        User_Friend_receiverIdToUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
    });

    const friends: any[] = [];
    const incoming: any[] = [];
    const outgoing: any[] = [];

    friendships.forEach((f) => {
      if (f.status === "ACCEPTED") {
        const isSender = f.senderId === userId;
        const friendUser = isSender
          ? f.User_Friend_receiverIdToUser
          : f.User_Friend_senderIdToUser;
        friends.push({
          friendshipId: f.id,
          user: friendUser,
          createdAt: f.createdAt,
        });
      } else if (f.status === "PENDING") {
        if (f.receiverId === userId) {
          incoming.push({
            requestId: f.id,
            user: f.User_Friend_senderIdToUser,
            createdAt: f.createdAt,
          });
        } else {
          outgoing.push({
            requestId: f.id,
            user: f.User_Friend_receiverIdToUser,
            createdAt: f.createdAt,
          });
        }
      }
    });

    return res.status(200).json({
      success: true,
      friends,
      incoming,
      outgoing,
    });
  } catch (error: any) {
    console.error("Error in getFriends:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /api/friends/request
export const sendRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { username } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!username) {
      return res.status(400).json({ success: false, message: "Username is required" });
    }

    const receiver = await prisma.user.findUnique({
      where: { username },
    });

    if (!receiver) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (receiver.id === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a friend request to yourself",
      });
    }

    // Check if relationship already exists
    const existing = await prisma.friend.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === "ACCEPTED") {
        return res.status(400).json({ success: false, message: "You are already friends" });
      } else if (existing.status === "PENDING") {
        if (existing.senderId === userId) {
          return res.status(400).json({ success: false, message: "Friend request already sent" });
        } else {
          return res.status(400).json({
            success: false,
            message: "User has already sent you a friend request. Accept it instead!",
          });
        }
      } else if (existing.status === "BLOCKED") {
        return res.status(400).json({ success: false, message: "This user is blocked" });
      }
    }

    const newFriendRequest = await prisma.friend.create({
      data: {
        senderId: userId,
        receiverId: receiver.id,
        status: "PENDING",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Friend request sent successfully",
      friendRequest: newFriendRequest,
    });
  } catch (error: any) {
    console.error("Error in sendRequest:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /api/friends/accept
export const acceptRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { requestId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!requestId) {
      return res.status(400).json({ success: false, message: "Request ID is required" });
    }

    const friendRequest = await prisma.friend.findUnique({
      where: { id: requestId },
    });

    if (
      !friendRequest ||
      friendRequest.receiverId !== userId ||
      friendRequest.status !== "PENDING"
    ) {
      return res.status(404).json({
        success: false,
        message: "Pending friend request not found",
      });
    }

    const updated = await prisma.friend.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
    });

    return res.status(200).json({
      success: true,
      message: "Friend request accepted",
      friendship: updated,
    });
  } catch (error: any) {
    console.error("Error in acceptRequest:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /api/friends/decline
export const declineRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { requestId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!requestId) {
      return res.status(400).json({ success: false, message: "Request ID is required" });
    }

    const friendRequest = await prisma.friend.findUnique({
      where: { id: requestId },
    });

    if (
      !friendRequest ||
      (friendRequest.receiverId !== userId && friendRequest.senderId !== userId) ||
      friendRequest.status !== "PENDING"
    ) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    await prisma.friend.delete({
      where: { id: requestId },
    });

    return res.status(200).json({
      success: true,
      message: "Friend request declined or cancelled",
    });
  } catch (error: any) {
    console.error("Error in declineRequest:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /api/friends/remove
export const removeFriend = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { friendshipId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!friendshipId) {
      return res.status(400).json({ success: false, message: "Friendship ID is required" });
    }

    const friendship = await prisma.friend.findUnique({
      where: { id: friendshipId },
    });

    if (
      !friendship ||
      (friendship.senderId !== userId && friendship.receiverId !== userId) ||
      friendship.status !== "ACCEPTED"
    ) {
      return res.status(404).json({
        success: false,
        message: "Friendship not found",
      });
    }

    await prisma.friend.delete({
      where: { id: friendshipId },
    });

    return res.status(200).json({
      success: true,
      message: "Friend removed successfully",
    });
  } catch (error: any) {
    console.error("Error in removeFriend:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/friends/search
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const query = req.query.q as string;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!query) {
      return res.status(200).json({ success: true, users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        email: true,
      },
      take: 10,
    });

    const userIds = users.map((u) => u.id);

    const relations = await prisma.friend.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: { in: userIds } },
          { senderId: { in: userIds }, receiverId: userId },
        ],
      },
    });

    const usersWithStatus = users.map((u) => {
      const rel = relations.find(
        (r) =>
          (r.senderId === userId && r.receiverId === u.id) ||
          (r.senderId === u.id && r.receiverId === userId)
      );

      let status = "NONE";
      let relationId = null;

      if (rel) {
        relationId = rel.id;
        if (rel.status === "ACCEPTED") {
          status = "ACCEPTED";
        } else if (rel.status === "PENDING") {
          status = rel.senderId === userId ? "PENDING_OUTGOING" : "PENDING_INCOMING";
        }
      }

      return {
        ...u,
        friendshipStatus: status,
        friendshipId: relationId,
      };
    });

    return res.status(200).json({
      success: true,
      users: usersWithStatus,
    });
  } catch (error: any) {
    console.error("Error in searchUsers:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
