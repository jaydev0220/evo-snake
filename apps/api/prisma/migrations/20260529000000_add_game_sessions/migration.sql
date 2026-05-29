CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "map" TEXT NOT NULL DEFAULT 'classic',
    "seed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GameSession_playerId_createdAt_idx" ON "GameSession"("playerId", "createdAt");
CREATE INDEX "GameSession_expiresAt_idx" ON "GameSession"("expiresAt");

