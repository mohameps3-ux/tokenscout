import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolvePath(dbPath: string): string {
  // If already absolute path (starts with / on Linux or X:\ on Windows), use as-is
  if (dbPath.startsWith("/") || /^[A-Za-z]:[\\/]/.test(dbPath)) {
    return dbPath;
  }
  // Join with cwd using simple string concatenation (avoids node:path Edge Runtime issue)
  const cwd = process.cwd();
  const sep = cwd.includes("\\") ? "\\" : "/";
  return cwd.endsWith(sep) ? cwd + dbPath : cwd + sep + dbPath;
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/tokenscout.db";
  // Strip the "file:" prefix for better-sqlite3
  const dbPath = dbUrl.startsWith("file:") ? dbUrl.slice(5) : dbUrl;

  // Resolve relative paths from the project root (cwd)
  const resolvedPath = resolvePath(dbPath);

  const adapter = new PrismaBetterSqlite3({ url: resolvedPath });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
