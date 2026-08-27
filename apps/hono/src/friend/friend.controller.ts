import { FriendRequestStatus, prisma } from "@repo/db";
import * as friendService from "./friends.services.js";
import { catchAsync } from "../utils/catchAsync.js";

export const discoverFriends = catchAsync(async (c: any) => {
	const userPayload = c.get("user");
	const { userId } = userPayload;
	const search = c.req.query("search");
	const skip = c.req.query("skip");
	const take = c.req.query("take");
	const excludePending = c.req.query("excludePending");

	const result = await friendService.getNonFriends(userId, {
		search: search || undefined,
		skip: skip ? Number(skip) : undefined,
		take: take ? Number(take) : undefined,
		excludePending:
			excludePending === undefined ? undefined : excludePending === "true",
	});
	return c.json(result, 200);
});

export const sendRequest = catchAsync(async (c: any) => {
	const userPayload = c.get("user");
	const { userId } = userPayload;
	const { username, receiverId } = await c.req.json();

	if (!username && !receiverId) {
		return c.json(
			{ success: false, message: "Username or receiverId is required" },
			400,
		);
	}

	let receiver;
	if (receiverId) {
		receiver = await prisma.user.findUnique({ where: { id: receiverId } });
	} else {
		receiver = await prisma.user.findUnique({ where: { username } });
	}

	if (!receiver) {
		return c.json({ success: false, message: "User not found" }, 404);
	}

	if (receiver.id === userId) {
		return c.json(
			{
				success: false,
				message: "You cannot send a friend request to yourself",
			},
			400,
		);
	}

	const existingFriendship = await prisma.friendship.findFirst({
		where: {
			OR: [
				{ userAId: userId, userBId: receiver.id },
				{ userAId: receiver.id, userBId: userId },
			],
		},
	});

	if (existingFriendship) {
		return c.json(
			{ success: false, message: "You are already friends with this user" },
			400,
		);
	}

	const existingRequest = await prisma.friendRequest.findFirst({
		where: {
			OR: [
				{ senderId: userId, receiverId: receiver.id },
				{ senderId: receiver.id, receiverId: userId },
			],
		},
	});

	if (existingRequest) {
		if (existingRequest.status === FriendRequestStatus.PENDING) {
			if (existingRequest.senderId === userId) {
				return c.json(
					{ success: false, message: "Friend request already sent" },
					400,
				);
			} else {
				return c.json(
					{
						success: false,
						message:
							"This user has already sent you a friend request. Accept it instead!",
					},
					400,
				);
			}
		}
		const updatedRequest = await prisma.friendRequest.update({
			where: { id: existingRequest.id },
			data: {
				senderId: userId,
				receiverId: receiver.id,
				status: FriendRequestStatus.PENDING,
			},
		});
		return c.json({ success: true, friendRequest: updatedRequest }, 200);
	}

	const newRequest = await prisma.friendRequest.create({
		data: {
			senderId: userId,
			receiverId: receiver.id,
			status: FriendRequestStatus.PENDING,
		},
	});

	return c.json({ success: true, friendRequest: newRequest }, 201);
});

export const listReceivedRequests = catchAsync(async (c: any) => {
	const userPayload = c.get("user");
	const { userId } = userPayload;
	const requests = await prisma.friendRequest.findMany({
		where: { receiverId: userId, status: FriendRequestStatus.PENDING },
		include: {
			sender: {
				select: {
					id: true,
					username: true,
					firstName: true,
					lastName: true,
					avatar: true,
				},
			},
		},
	});
	return c.json(requests, 200);
});

export const listSentRequests = catchAsync(async (c: any) => {
	const userPayload = c.get("user");
	const { userId } = userPayload;
	const requests = await prisma.friendRequest.findMany({
		where: { senderId: userId, status: FriendRequestStatus.PENDING },
		include: {
			receiver: {
				select: {
					id: true,
					username: true,
					firstName: true,
					lastName: true,
					avatar: true,
				},
			},
		},
	});
	return c.json(requests, 200);
});

export const acceptRequest = catchAsync(async (c: any) => {
	const userPayload = c.get("user");
	const { userId } = userPayload;
	const requestIdParam = c.req.param("id");
	let requestId = requestIdParam;

	if (!requestId) {
		try {
			const body = await c.req.json();
			requestId = body.requestId;
		} catch (_e) {
			// JSON body missing
		}
	}

	if (!requestId) {
		return c.json({ success: false, message: "Request ID is required" }, 400);
	}

	const friendRequest = await prisma.friendRequest.findUnique({
		where: { id: requestId },
	});

	if (!friendRequest) {
		return c.json({ success: false, message: "Friend request not found" }, 404);
	}

	if (friendRequest.receiverId !== userId) {
		return c.json(
			{
				success: false,
				message: "You are not authorized to accept this request",
			},
			403,
		);
	}

	if (friendRequest.status !== FriendRequestStatus.PENDING) {
		return c.json(
			{
				success: false,
				message: `Request cannot be accepted because status is ${friendRequest.status}`,
			},
			400,
		);
	}

	const [updatedRequest, friendship] = await prisma.$transaction([
		prisma.friendRequest.update({
			where: { id: requestId },
			data: { status: FriendRequestStatus.ACCEPTED },
		}),
		prisma.friendship.create({
			data: {
				userAId: friendRequest.senderId,
				userBId: friendRequest.receiverId,
			},
		}),
	]);

	return c.json(
		{ success: true, friendRequest: updatedRequest, friendship },
		200,
	);
});

export const rejectRequest = catchAsync(async (c: any) => {
	const userPayload = c.get("user");
	const { userId } = userPayload;
	const requestIdParam = c.req.param("id");
	let requestId = requestIdParam;

	if (!requestId) {
		try {
			const body = await c.req.json();
			requestId = body.requestId;
		} catch (_e) {
			// JSON body missing
		}
	}

	if (!requestId) {
		return c.json({ success: false, message: "Request ID is required" }, 400);
	}

	const friendRequest = await prisma.friendRequest.findUnique({
		where: { id: requestId },
	});

	if (!friendRequest) {
		return c.json({ success: false, message: "Friend request not found" }, 404);
	}

	if (friendRequest.receiverId !== userId) {
		return c.json(
			{
				success: false,
				message: "You are not authorized to reject this request",
			},
			403,
		);
	}

	const updatedRequest = await prisma.friendRequest.update({
		where: { id: requestId },
		data: { status: FriendRequestStatus.REJECTED },
	});

	return c.json({ success: true, friendRequest: updatedRequest }, 200);
});

export const cancelRequest = catchAsync(async (c: any) => {
	const userPayload = c.get("user");
	const { userId } = userPayload;
	const requestIdParam = c.req.param("id");
	let requestId = requestIdParam;

	if (!requestId) {
		try {
			const body = await c.req.json();
			requestId = body.requestId;
		} catch (_e) {
			// JSON body missing
		}
	}

	if (!requestId) {
		return c.json({ success: false, message: "Request ID is required" }, 400);
	}

	const friendRequest = await prisma.friendRequest.findUnique({
		where: { id: requestId },
	});

	if (!friendRequest) {
		return c.json({ success: false, message: "Friend request not found" }, 404);
	}

	if (friendRequest.senderId !== userId) {
		return c.json(
			{
				success: false,
				message: "You are not authorized to cancel this request",
			},
			403,
		);
	}

	const updatedRequest = await prisma.friendRequest.update({
		where: { id: requestId },
		data: { status: FriendRequestStatus.CANCELLED },
	});

	return c.json({ success: true, friendRequest: updatedRequest }, 200);
});

export const listFriends = catchAsync(async (c: any) => {
	const userPayload = c.get("user");
	const { userId } = userPayload;

	const friendships = await prisma.friendship.findMany({
		where: {
			OR: [{ userAId: userId }, { userBId: userId }],
		},
		include: {
			userA: {
				select: {
					id: true,
					username: true,
					firstName: true,
					lastName: true,
					avatar: true,
					email: true,
				},
			},
			userB: {
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

	const incomingRequests = await prisma.friendRequest.findMany({
		where: {
			receiverId: userId,
			status: FriendRequestStatus.PENDING,
		},
		include: {
			sender: {
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

	const outgoingRequests = await prisma.friendRequest.findMany({
		where: {
			senderId: userId,
			status: FriendRequestStatus.PENDING,
		},
		include: {
			receiver: {
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

	const friends = friendships.map((f) => {
		const friendUser = f.userAId === userId ? f.userB : f.userA;
		return {
			friendshipId: f.id,
			user: friendUser,
			createdAt: f.createdAt,
		};
	});

	const incoming = incomingRequests.map((r) => ({
		requestId: r.id,
		user: r.sender,
		createdAt: r.createdAt,
	}));

	const outgoing = outgoingRequests.map((r) => ({
		requestId: r.id,
		user: r.receiver,
		createdAt: r.createdAt,
	}));

	return c.json(
		{
			success: true,
			friends,
			incoming,
			outgoing,
		},
		200,
	);
});

export const removeFriend = catchAsync(async (c: any) => {
	const userPayload = c.get("user");
	const { userId } = userPayload;
	const friendIdParam = c.req.param("friendId");
	let friendshipId = friendIdParam;

	if (!friendshipId) {
		try {
			const body = await c.req.json();
			friendshipId = body.friendshipId;
		} catch (_e) {
			// JSON body missing
		}
	}

	if (!friendshipId) {
		return c.json(
			{ success: false, message: "Friendship ID is required" },
			400,
		);
	}

	let friendship = await prisma.friendship.findUnique({
		where: { id: friendshipId },
	});

	if (!friendship) {
		friendship = await prisma.friendship.findFirst({
			where: {
				OR: [
					{ userAId: userId, userBId: friendshipId },
					{ userAId: friendshipId, userBId: userId },
				],
			},
		});
	}

	if (!friendship) {
		return c.json({ success: false, message: "Friendship not found" }, 404);
	}

	if (friendship.userAId !== userId && friendship.userBId !== userId) {
		return c.json(
			{
				success: false,
				message: "You are not authorized to remove this friend",
			},
			403,
		);
	}

	await prisma.$transaction([
		prisma.friendship.delete({
			where: { id: friendship.id },
		}),
		prisma.friendRequest.deleteMany({
			where: {
				OR: [
					{ senderId: friendship.userAId, receiverId: friendship.userBId },
					{ senderId: friendship.userBId, receiverId: friendship.userAId },
				],
			},
		}),
	]);

	return c.json({ success: true, message: "Friend removed successfully" }, 200);
});

export const friendshipStatus = catchAsync(async (c: any) => {
	const userPayload = c.get("user");
	const { userId } = userPayload;
	const targetUserId = c.req.param("userId");

	if (userId === targetUserId) {
		return c.json({ status: "SELF" }, 200);
	}

	const friendship = await prisma.friendship.findFirst({
		where: {
			OR: [
				{ userAId: userId, userBId: targetUserId },
				{ userAId: targetUserId, userBId: userId },
			],
		},
	});

	if (friendship) {
		return c.json({ status: "ACCEPTED", friendshipId: friendship.id }, 200);
	}

	const request = await prisma.friendRequest.findFirst({
		where: {
			OR: [
				{ senderId: userId, receiverId: targetUserId },
				{ senderId: targetUserId, receiverId: userId },
			],
		},
	});

	if (request) {
		if (request.status === FriendRequestStatus.PENDING) {
			return c.json(
				{
					status:
						request.senderId === userId
							? "PENDING_OUTGOING"
							: "PENDING_INCOMING",
					requestId: request.id,
				},
				200,
			);
		}
		return c.json({ status: request.status }, 200);
	}

	return c.json({ status: "NONE" }, 200);
});
