import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "ts_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** Returns the current user from the session cookie, or null if no session */
export async function getSession(): Promise<{
  id: string;
  eloScore: number;
  totalPredictions: number;
  correctPredictions: number;
  username: string | null;
} | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      eloScore: true,
      totalPredictions: true,
      correctPredictions: true,
      username: true,
    },
  });

  return user;
}

/** Returns session ID from cookie, creating a new cookie value if absent */
export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  // Generate a new cuid-style ID via prisma's default
  const { id } = await prisma.user.create({ data: {} });
  return id;
}

/** Gets or creates the full User record for the current session */
export async function getOrCreateUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    const user = await prisma.user.findUnique({ where: { id: sessionId } });
    if (user) return { user, isNew: false };
  }

  // Create new user
  const user = await prisma.user.create({ data: {} });
  return { user, isNew: true };
}

export { SESSION_COOKIE, SESSION_MAX_AGE };
