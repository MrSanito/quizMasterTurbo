-- AlterEnum
ALTER TYPE "RoomState" ADD VALUE 'COUNTDOWN';

-- AlterTable
ALTER TABLE "PlayerAnswer" ADD COLUMN     "pointsEarned" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "RoomPlayer" ADD COLUMN     "avatarSnapshot" TEXT,
ADD COLUMN     "gameJoinedAt" TIMESTAMP(3),
ADD COLUMN     "hasJoinedGame" BOOLEAN NOT NULL DEFAULT false;
