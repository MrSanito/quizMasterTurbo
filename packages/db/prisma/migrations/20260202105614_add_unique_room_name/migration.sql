/*
  Warnings:

  - A unique constraint covering the columns `[roomName]` on the table `Room` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Room_roomName_key" ON "Room"("roomName");
