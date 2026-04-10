-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT,
    "username" TEXT,
    "eloScore" INTEGER NOT NULL DEFAULT 1000,
    "totalPredictions" INTEGER NOT NULL DEFAULT 0,
    "correctPredictions" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "pairAddress" TEXT,
    "dexId" TEXT,
    "priceUsd" REAL,
    "liquidity" REAL,
    "marketCap" REAL,
    "volume24h" REAL,
    "priceChange24h" REAL,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "liquidityScore" INTEGER NOT NULL DEFAULT 0,
    "holderScore" INTEGER NOT NULL DEFAULT 0,
    "ageScore" INTEGER NOT NULL DEFAULT 0,
    "volumeScore" INTEGER NOT NULL DEFAULT 0,
    "suspicionScore" INTEGER NOT NULL DEFAULT 0,
    "holderCount" INTEGER,
    "tokenAge" INTEGER,
    "isHoneypot" BOOLEAN NOT NULL DEFAULT false,
    "hasBundledBuys" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "listedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenId" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "liquidityScore" INTEGER NOT NULL,
    "holderScore" INTEGER NOT NULL,
    "ageScore" INTEGER NOT NULL,
    "volumeScore" INTEGER NOT NULL,
    "suspicionScore" INTEGER NOT NULL,
    "priceUsd" REAL,
    "liquidity" REAL,
    "marketCap" REAL,
    "volume24h" REAL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Score_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "correct" BOOLEAN,
    "eloChange" INTEGER,
    "priceAtPrediction" REAL,
    "priceAtResolution" REAL,
    "resolvedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Prediction_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "eloScore" INTEGER NOT NULL,
    "rank" INTEGER,
    "predictions" INTEGER NOT NULL DEFAULT 0,
    "accuracy" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "LeaderboardEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "awardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "duration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_eloScore_idx" ON "User"("eloScore");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "Token_chain_idx" ON "Token"("chain");

-- CreateIndex
CREATE INDEX "Token_totalScore_idx" ON "Token"("totalScore");

-- CreateIndex
CREATE INDEX "Token_createdAt_idx" ON "Token"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Token_address_chain_key" ON "Token"("address", "chain");

-- CreateIndex
CREATE INDEX "Score_tokenId_idx" ON "Score"("tokenId");

-- CreateIndex
CREATE INDEX "Score_recordedAt_idx" ON "Score"("recordedAt");

-- CreateIndex
CREATE INDEX "Prediction_userId_idx" ON "Prediction"("userId");

-- CreateIndex
CREATE INDEX "Prediction_tokenId_idx" ON "Prediction"("tokenId");

-- CreateIndex
CREATE INDEX "Prediction_resolved_idx" ON "Prediction"("resolved");

-- CreateIndex
CREATE INDEX "Prediction_expiresAt_idx" ON "Prediction"("expiresAt");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_weekStart_eloScore_idx" ON "LeaderboardEntry"("weekStart", "eloScore");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_userId_weekStart_key" ON "LeaderboardEntry"("userId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badge_key" ON "UserBadge"("userId", "badge");

-- CreateIndex
CREATE INDEX "JobLog_jobName_idx" ON "JobLog"("jobName");

-- CreateIndex
CREATE INDEX "JobLog_createdAt_idx" ON "JobLog"("createdAt");
