/*
  Warnings:

  - Added the required column `questions` to the `QuizAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeTaken` to the `QuizAttempt` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "QuizAttempt" DROP CONSTRAINT "QuizAttempt_userId_fkey";

-- DropIndex
DROP INDEX "QuizAttempt_userId_quizId_key";

-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN     "guestId" TEXT,
ADD COLUMN     "questions" JSONB NOT NULL,
ADD COLUMN     "timeTaken" INTEGER NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "QuizAttempt_quizId_idx" ON "QuizAttempt"("quizId");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_idx" ON "QuizAttempt"("userId");

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
