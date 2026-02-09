export interface Player {
  id: string;
  name: string;
  avatar?: string;
}

export interface JoinRoomPayload {
  roomId: string;
  player: Player;
  avatar: string;
}

export interface AnswerPayload {
  roomId: string;
  userId: string;
  answer: string;
  timeTaken: number;
}
