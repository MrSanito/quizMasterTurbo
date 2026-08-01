import { Request, Response, NextFunction } from 'express';
import { TryCatch } from '../middleware/tryCatch';
import * as friendService from './friends.services';
import { prisma, FriendRequestStatus } from '@repo/db';

export const discoverFriends = TryCatch( async (req: Request, res: Response) => {
  const {userId} = req.user;
  const { search, skip, take, excludePending } = req.query;

  const result = await friendService.getNonFriends(userId, {
    search: search as string | undefined,
    skip: skip ? Number(skip) : undefined,
    take: take ? Number(take) : undefined,
    excludePending: excludePending === undefined ? undefined : excludePending === 'true',
  });
  res.status(200).json(result);
});

export const sendRequest = TryCatch( async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { username, receiverId } = req.body;

  if (!username && !receiverId) {
    return res.status(400).json({ success: false, message: "Username or receiverId is required" });
  }

  let receiver;
  if (receiverId) {
    receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  } else {
    receiver = await prisma.user.findUnique({ where: { username } });
  }

  if (!receiver) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (receiver.id === userId) {
    return res.status(400).json({ success: false, message: "You cannot send a friend request to yourself" });
  }

  // Check if they are already friends
  const existingFriendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userAId: userId, userBId: receiver.id },
        { userAId: receiver.id, userBId: userId }
      ]
    }
  });

  if (existingFriendship) {
    return res.status(400).json({ success: false, message: "You are already friends with this user" });
  }

  // Check if a request already exists
  const existingRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: userId, receiverId: receiver.id },
        { senderId: receiver.id, receiverId: userId }
      ]
    }
  });

  if (existingRequest) {
    if (existingRequest.status === FriendRequestStatus.PENDING) {
      if (existingRequest.senderId === userId) {
        return res.status(400).json({ success: false, message: "Friend request already sent" });
      } else {
        return res.status(400).json({ success: false, message: "This user has already sent you a friend request. Accept it instead!" });
      }
    }
    // If rejected/cancelled, we can update it to PENDING again
    const updatedRequest = await prisma.friendRequest.update({
      where: { id: existingRequest.id },
      data: {
        senderId: userId,
        receiverId: receiver.id,
        status: FriendRequestStatus.PENDING
      }
    });
    return res.status(200).json({ success: true, friendRequest: updatedRequest });
  }

  // Create new request
  const newRequest = await prisma.friendRequest.create({
    data: {
      senderId: userId,
      receiverId: receiver.id,
      status: FriendRequestStatus.PENDING
    }
  });

  res.status(201).json({ success: true, friendRequest: newRequest });
});

export const listReceivedRequests = TryCatch( async (req: Request, res: Response) => {
  const { userId } = req.user;
  const requests = await prisma.friendRequest.findMany({
    where: { receiverId: userId, status: FriendRequestStatus.PENDING },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      }
    }
  });
  res.status(200).json(requests);
});

export const listSentRequests = TryCatch( async (req: Request, res: Response) => {
  const { userId } = req.user;
  const requests = await prisma.friendRequest.findMany({
    where: { senderId: userId, status: FriendRequestStatus.PENDING },
    include: {
      receiver: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      }
    }
  });
  res.status(200).json(requests);
});

export const acceptRequest = TryCatch( async (req: Request, res: Response) => {
  const { userId } = req.user;
  const requestId = req.params.id || req.body.requestId;

  if (!requestId) {
    return res.status(400).json({ success: false, message: "Request ID is required" });
  }

  const friendRequest = await prisma.friendRequest.findUnique({
    where: { id: requestId }
  });

  if (!friendRequest) {
    return res.status(404).json({ success: false, message: "Friend request not found" });
  }

  if (friendRequest.receiverId !== userId) {
    return res.status(403).json({ success: false, message: "You are not authorized to accept this request" });
  }

  if (friendRequest.status !== FriendRequestStatus.PENDING) {
    return res.status(400).json({ success: false, message: `Request cannot be accepted because status is ${friendRequest.status}` });
  }

  // Use a transaction to accept request and create friendship
  const [updatedRequest, friendship] = await prisma.$transaction([
    prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: FriendRequestStatus.ACCEPTED }
    }),
    prisma.friendship.create({
      data: {
        userAId: friendRequest.senderId,
        userBId: friendRequest.receiverId
      }
    })
  ]);

  res.status(200).json({ success: true, friendRequest: updatedRequest, friendship });
});

export const rejectRequest = TryCatch( async (req: Request, res: Response) => {
  const { userId } = req.user;
  const requestId = req.params.id || req.body.requestId;

  if (!requestId) {
    return res.status(400).json({ success: false, message: "Request ID is required" });
  }

  const friendRequest = await prisma.friendRequest.findUnique({
    where: { id: requestId }
  });

  if (!friendRequest) {
    return res.status(404).json({ success: false, message: "Friend request not found" });
  }

  if (friendRequest.receiverId !== userId) {
    return res.status(403).json({ success: false, message: "You are not authorized to reject this request" });
  }

  const updatedRequest = await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: FriendRequestStatus.REJECTED }
  });

  res.status(200).json({ success: true, friendRequest: updatedRequest });
});

export const cancelRequest = TryCatch( async (req: Request, res: Response) => {
  const { userId } = req.user;
  const requestId = req.params.id || req.body.requestId;

  if (!requestId) {
    return res.status(400).json({ success: false, message: "Request ID is required" });
  }

  const friendRequest = await prisma.friendRequest.findUnique({
    where: { id: requestId }
  });

  if (!friendRequest) {
    return res.status(404).json({ success: false, message: "Friend request not found" });
  }

  if (friendRequest.senderId !== userId) {
    return res.status(403).json({ success: false, message: "You are not authorized to cancel this request" });
  }

  const updatedRequest = await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: FriendRequestStatus.CANCELLED }
  });

  res.status(200).json({ success: true, friendRequest: updatedRequest });
});

export const listFriends = TryCatch( async (req: Request, res: Response) => {
  const { userId } = req.user;

  // 1. Fetch friendships
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { userAId: userId },
        { userBId: userId }
      ]
    },
    include: {
      userA: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          email: true
        }
      },
      userB: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          email: true
        }
      }
    }
  });

  // 2. Fetch pending incoming and outgoing requests
  const incomingRequests = await prisma.friendRequest.findMany({
    where: {
      receiverId: userId,
      status: FriendRequestStatus.PENDING
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          email: true
        }
      }
    }
  });

  const outgoingRequests = await prisma.friendRequest.findMany({
    where: {
      senderId: userId,
      status: FriendRequestStatus.PENDING
    },
    include: {
      receiver: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          email: true
        }
      }
    }
  });

  const friends = friendships.map(f => {
    const friendUser = f.userAId === userId ? f.userB : f.userA;
    return {
      friendshipId: f.id,
      user: friendUser,
      createdAt: f.createdAt
    };
  });

  const incoming = incomingRequests.map(r => ({
    requestId: r.id,
    user: r.sender,
    createdAt: r.createdAt
  }));

  const outgoing = outgoingRequests.map(r => ({
    requestId: r.id,
    user: r.receiver,
    createdAt: r.createdAt
  }));

  res.status(200).json({
    success: true,
    friends,
    incoming,
    outgoing
  });
});

export const removeFriend = TryCatch( async (req: Request, res: Response) => {
  const { userId } = req.user;
  const friendshipId = req.params.friendId || req.body.friendshipId;

  if (!friendshipId) {
    return res.status(400).json({ success: false, message: "Friendship ID is required" });
  }

  let friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId }
  });

  if (!friendship) {
    friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: friendshipId },
          { userAId: friendshipId, userBId: userId }
        ]
      }
    });
  }

  if (!friendship) {
    return res.status(404).json({ success: false, message: "Friendship not found" });
  }

  if (friendship.userAId !== userId && friendship.userBId !== userId) {
    return res.status(403).json({ success: false, message: "You are not authorized to remove this friend" });
  }

  await prisma.$transaction([
    prisma.friendship.delete({
      where: { id: friendship.id }
    }),
    prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: friendship.userAId, receiverId: friendship.userBId },
          { senderId: friendship.userBId, receiverId: friendship.userAId }
        ]
      }
    })
  ]);

  res.status(200).json({ success: true, message: "Friend removed successfully" });
});

export const friendshipStatus = TryCatch( async (req: Request, res: Response) => {
  const { userId } = req.user;
  const targetUserId = req.params.userId as string;

  if (userId === targetUserId) {
    return res.status(200).json({ status: "SELF" });
  }

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userAId: userId, userBId: targetUserId },
        { userAId: targetUserId, userBId: userId }
      ]
    }
  });

  if (friendship) {
    return res.status(200).json({ status: "ACCEPTED", friendshipId: friendship.id });
  }

  const request = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: userId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: userId }
      ]
    }
  });

  if (request) {
    if (request.status === FriendRequestStatus.PENDING) {
      return res.status(200).json({
        status: request.senderId === userId ? "PENDING_OUTGOING" : "PENDING_INCOMING",
        requestId: request.id
      });
    }
    return res.status(200).json({ status: request.status });
  }

  res.status(200).json({ status: "NONE" });
});
