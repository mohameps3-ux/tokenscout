import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

// GET /api/user — get or create session user
export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    const user = await prisma.user.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        eloScore: true,
        totalPredictions: true,
        correctPredictions: true,
        username: true,
        tier: true,
        badges: { select: { badge: true, awardedAt: true } },
      },
    });
    if (user) {
      return Response.json({ user, isNew: false });
    }
  }

  // Create new user
  const user = await prisma.user.create({
    data: {},
    select: {
      id: true,
      eloScore: true,
      totalPredictions: true,
      correctPredictions: true,
      username: true,
      tier: true,
      badges: { select: { badge: true, awardedAt: true } },
    },
  });

  const response = Response.json({ user, isNew: true });
  // Set session cookie — done via Set-Cookie header
  const res = new Response(response.body, response);
  res.headers.set(
    "Set-Cookie",
    `${SESSION_COOKIE}=${user.id}; Path=/; Max-Age=${SESSION_MAX_AGE}; HttpOnly; SameSite=Lax`
  );
  return res;
}

// PATCH /api/user — update username
export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return Response.json({ error: "No session" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === "string"
    ? body.username.trim().slice(0, 24)
    : null;

  if (!username || username.length < 2) {
    return Response.json({ error: "Username must be 2–24 characters" }, { status: 400 });
  }

  // Basic sanitize: only alphanumeric + underscore
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return Response.json({ error: "Only letters, numbers, and underscores allowed" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: sessionId },
      data: { username },
      select: { id: true, username: true, eloScore: true },
    });
    return Response.json({ user });
  } catch {
    return Response.json({ error: "Username already taken" }, { status: 409 });
  }
}
