import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/tokenscout.db";
  // Strip the "file:" prefix for better-sqlite3
  const dbPath = dbUrl.startsWith("file:") ? dbUrl.slice(5) : dbUrl;

  // Resolve relative paths from the project root (cwd)
  // turbopackIgnore: true
  const resolvedPath = path.isAbsolute(dbPath)
    ? dbPath
    : path.join(/*turbopackIgnore: true*/ process.cwd(), dbPath);

  const adapter = new PrismaBetterSqlite3({ url: resolvedPath });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
