-- CreateTable
CREATE TABLE "WhaleWallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "buyCount" INTEGER NOT NULL DEFAULT 0,
    "sellCount" INTEGER NOT NULL DEFAULT 0,
    "totalVolume" REAL NOT NULL DEFAULT 0,
    "winCount" INTEGER NOT NULL DEFAULT 0,
    "bestTradeUsd" REAL NOT NULL DEFAULT 0,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WhaleFollow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WhaleFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WhaleWallet_totalVolume_idx" ON "WhaleWallet"("totalVolume");

-- CreateIndex
CREATE INDEX "WhaleWallet_chain_idx" ON "WhaleWallet"("chain");

-- CreateIndex
CREATE INDEX "WhaleWallet_lastSeen_idx" ON "WhaleWallet"("lastSeen");

-- CreateIndex
CREATE UNIQUE INDEX "WhaleWallet_address_chain_key" ON "WhaleWallet"("address", "chain");

-- CreateIndex
CREATE INDEX "WhaleFollow_userId_idx" ON "WhaleFollow"("userId");

-- CreateIndex
CREATE INDEX "WhaleFollow_walletAddress_chain_idx" ON "WhaleFollow"("walletAddress", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "WhaleFollow_userId_walletAddress_chain_key" ON "WhaleFollow"("userId", "walletAddress", "chain");
