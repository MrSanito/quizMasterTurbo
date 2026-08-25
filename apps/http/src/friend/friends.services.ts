import { FriendRequestStatus, prisma } from "@repo/db";

export async function getNonFriends(
	userId: string,
	options: {
		excludePending?: boolean;
		search?: string;
		skip?: number;
		take?: number;
	} = {},
) {
	const { excludePending = true, search, skip = 0 } = options;
	const take = Math.min(options.take ?? 20, 100); // clamp to avoid huge scans

	const friendships = await prisma.friendship.findMany({
		where: { OR: [{ userAId: userId }, { userBId: userId }] },
		select: { userAId: true, userBId: true },
	});
	const excludeIds = new Set<string>([userId]);
	friendships.forEach((f) =>
		excludeIds.add(f.userAId === userId ? f.userBId : f.userAId),
	);

	if (excludePending) {
		const pending = await prisma.friendRequest.findMany({
			where: {
				status: FriendRequestStatus.PENDING,
				OR: [{ senderId: userId }, { receiverId: userId }],
			},
			select: { senderId: true, receiverId: true },
		});
		pending.forEach((p) =>
			excludeIds.add(p.senderId === userId ? p.receiverId : p.senderId),
		);
	}

	const users = await prisma.user.findMany({
		where: {
			id: { notIn: Array.from(excludeIds) },
			...(search
				? {
						OR: [
							{ username: { contains: search, mode: "insensitive" } },
							{ firstName: { contains: search, mode: "insensitive" } },
							{ lastName: { contains: search, mode: "insensitive" } },
						],
					}
				: {}),
		},
		select: {
			id: true,
			username: true,
			firstName: true,
			lastName: true,
			avatar: true,
		},
		skip,
		take,
	});

	return users;
}
