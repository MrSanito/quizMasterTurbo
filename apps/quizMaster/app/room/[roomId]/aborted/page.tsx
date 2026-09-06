"use client";

import { useParams, useSearchParams } from "next/navigation";
import AbortedScreen from "@/components/AbortedScreen";

export default function RoomAbortedPage() {
	const { roomId } = useParams<{ roomId: string }>();
	const searchParams = useSearchParams();
	const message =
		searchParams.get("message") ||
		"This room has been aborted and closed by the host.";

	return <AbortedScreen roomId={roomId} message={message} />;
}
