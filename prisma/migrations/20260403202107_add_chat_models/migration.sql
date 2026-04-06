/*
  Warnings:

  - You are about to drop the column `diagnosisCard` on the `chat_messages` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `chat_messages` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `chat_messages` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `chat_messages` table. All the data in the column will be lost.
  - Made the column `sessionId` on table `chat_messages` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "chat_sessions_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_chat_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "diagnosisResult" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_chat_messages" ("content", "id", "role", "sessionId") SELECT "content", "id", "role", "sessionId" FROM "chat_messages";
DROP TABLE "chat_messages";
ALTER TABLE "new_chat_messages" RENAME TO "chat_messages";
CREATE INDEX "chat_messages_sessionId_idx" ON "chat_messages"("sessionId");
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "chat_sessions_userId_idx" ON "chat_sessions"("userId");

-- CreateIndex
CREATE INDEX "chat_sessions_vehicleId_idx" ON "chat_sessions"("vehicleId");

-- CreateIndex
CREATE INDEX "chat_sessions_updatedAt_idx" ON "chat_sessions"("updatedAt");
