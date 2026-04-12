-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AlertRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "label" TEXT,
    "telegramChatId" TEXT NOT NULL,
    "minScore" INTEGER NOT NULL DEFAULT 70,
    "minLiquidity" REAL,
    "chain" TEXT,
    "minPriceChange" REAL,
    "minAiScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AlertRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AlertRule" ("chain", "createdAt", "enabled", "id", "label", "minLiquidity", "minPriceChange", "minScore", "telegramChatId", "updatedAt", "userId") SELECT "chain", "createdAt", "enabled", "id", "label", "minLiquidity", "minPriceChange", "minScore", "telegramChatId", "updatedAt", "userId" FROM "AlertRule";
DROP TABLE "AlertRule";
ALTER TABLE "new_AlertRule" RENAME TO "AlertRule";
CREATE INDEX "AlertRule_userId_idx" ON "AlertRule"("userId");
CREATE INDEX "AlertRule_enabled_idx" ON "AlertRule"("enabled");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
