/*
  Warnings:

  - You are about to drop the column `selectedOption` on the `PlayerAnswer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[roomQuestionId,userId]` on the table `PlayerAnswer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `selectedOptionId` to the `PlayerAnswer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quizId` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlayerAnswer" DROP COLUMN "selectedOption",
ADD COLUMN     "selectedOptionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "quizId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RoomPlayer" ADD COLUMN     "pointsEarned" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "PlayerAnswer_roomQuestionId_idx" ON "PlayerAnswer"("roomQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerAnswer_roomQuestionId_userId_key" ON "PlayerAnswer"("roomQuestionId", "userId");

-- CreateIndex
CREATE INDEX "Room_quizId_idx" ON "Room"("quizId");

-- CreateIndex
CREATE INDEX "Room_hostId_idx" ON "Room"("hostId");

-- CreateIndex
CREATE INDEX "RoomPlayer_roomId_idx" ON "RoomPlayer"("roomId");

-- CreateIndex
CREATE INDEX "RoomPlayer_userId_idx" ON "RoomPlayer"("userId");

-- CreateIndex
CREATE INDEX "RoomQuestion_roomId_idx" ON "RoomQuestion"("roomId");

-- CreateIndex
CREATE INDEX "RoomQuestion_questionId_idx" ON "RoomQuestion"("questionId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
