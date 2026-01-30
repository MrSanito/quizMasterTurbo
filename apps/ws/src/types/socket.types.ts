export interface Player {
  id: string;
  name: string;
}

export interface JoinRoomPayload {
  roomId: string;
  player: Player;
}

export interface AnswerPayload {
  roomId: string;
  userId: string;
  answer: string;
  timeTaken: number;
}
