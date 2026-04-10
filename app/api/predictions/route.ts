import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

const PREDICTION_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 hours

// GET /api/predictions — get user's predictions
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return Response.json({ predictions: [] });

  const { searchParams } = request.nextUrl;
  const filter = searchParams.get("filter") ?? "active"; // active | resolved | all

  const where = {
    userId: sessionId,
    ...(filter === "active" ? { resolved: false } : {}),
    ...(filter === "resolved" ? { resolved: true } : {}),
  };

  const predictions = await prisma.prediction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      token: {
        select: {
          id: true,
          symbol: true,
          name: true,
          chain: true,
          priceUsd: true,
          totalScore: true,
        },
      },
    },
  });

  return Response.json({ predictions });
}

// POST /api/predictions — create a new prediction
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  // Auto-create user if no session
  let isNew = false;
  if (!sessionId) {
    const user = await prisma.user.create({ data: {} });
    sessionId = user.id;
    isNew = true;
  }

  const body = await request.json().catch(() => ({}));
  const { tokenId, direction, confidence } = body;

  // Validate
  if (!tokenId || typeof tokenId !== "string") {
    return Response.json({ error: "tokenId is required" }, { status: 400 });
  }
  if (direction !== "UP" && direction !== "DOWN") {
    return Response.json({ error: "direction must be UP or DOWN" }, { status: 400 });
  }
  const conf = parseInt(confidence) || 50;
  if (conf < 50 || conf > 100) {
    return Response.json({ error: "confidence must be 50–100" }, { status: 400 });
  }

  // Check token exists
  const token = await prisma.token.findUnique({ where: { id: tokenId } });
  if (!token) {
    return Response.json({ error: "Token not found" }, { status: 404 });
  }

  // Check user hasn't already predicted this token (active prediction)
  const existing = await prisma.prediction.findFirst({
    where: { userId: sessionId, tokenId, resolved: false },
  });
  if (existing) {
    return Response.json(
      { error: "You already have an active prediction for this token" },
      { status: 409 }
    );
  }

  const now = new Date();
  const prediction = await prisma.prediction.create({
    data: {
      userId: sessionId,
      tokenId,
      direction,
      confidence: conf,
      priceAtPrediction: token.priceUsd,
      expiresAt: new Date(now.getTime() + PREDICTION_WINDOW_MS),
    },
  });

  // Check if this is user's first prediction → award badge
  const user = await prisma.user.findUnique({ where: { id: sessionId } });
  if (user && user.totalPredictions === 0) {
    await prisma.userBadge.upsert({
      where: { userId_badge: { userId: sessionId, badge: "FIRST_PREDICTION" } },
      update: {},
      create: { userId: sessionId, badge: "FIRST_PREDICTION" },
    });
  }

  const response = Response.json({ prediction, success: true }, { status: 201 });

  // Set session cookie for new users
  if (isNew) {
    const res = new Response(response.body, response);
    res.headers.set(
      "Set-Cookie",
      `${SESSION_COOKIE}=${sessionId}; Path=/; Max-Age=${SESSION_MAX_AGE}; HttpOnly; SameSite=Lax`
    );
    return res;
  }

  return response;
}
