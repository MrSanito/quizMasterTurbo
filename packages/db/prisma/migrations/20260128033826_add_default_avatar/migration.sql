/*
  Warnings:
  - Made the column `avatar` on table `User` required. 
*/

-- 1. Update existing NULL values first
UPDATE "User" SET "avatar" = 'avatar1.svg' WHERE "avatar" IS NULL;

-- 2. Apply the table alterations
ALTER TABLE "User" ADD COLUMN "name" TEXT,
ALTER COLUMN "avatar" SET NOT NULL,
ALTER COLUMN "avatar" SET DEFAULT 'avatar1.svg';
