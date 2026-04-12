-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT,
    "username" TEXT,
    "eloScore" INTEGER NOT NULL DEFAULT 1000,
    "totalPredictions" INTEGER NOT NULL DEFAULT 0,
    "correctPredictions" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "referralCode" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "referredBy" TEXT,
    "proExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("correctPredictions", "createdAt", "eloScore", "id", "stripeCustomerId", "tier", "totalPredictions", "updatedAt", "username", "walletAddress") SELECT "correctPredictions", "createdAt", "eloScore", "id", "stripeCustomerId", "tier", "totalPredictions", "updatedAt", "username", "walletAddress" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
CREATE INDEX "User_eloScore_idx" ON "User"("eloScore");
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");
CREATE INDEX "User_referredBy_idx" ON "User"("referredBy");
CREATE INDEX "User_points_idx" ON "User"("points");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
