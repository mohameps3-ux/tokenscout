import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session";
import { CHAINS } from "@/lib/chains";

export const dynamic = "force-dynamic";

// GET /api/alerts — list this user's alert rules
export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return Response.json({ error: "No session" }, { status: 401 });

  const rules = await prisma.alertRule.findMany({
    where: { userId: sessionId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ rules });
}

// POST /api/alerts — create a new alert rule
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return Response.json({ error: "No session" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  const telegramChatId = typeof body.telegramChatId === "string" ? body.telegramChatId.trim() : null;
  if (!telegramChatId) return Response.json({ error: "telegramChatId is required" }, { status: 400 });

  const minScore = typeof body.minScore === "number"
    ? Math.min(100, Math.max(0, Math.round(body.minScore)))
    : 70;

  const minLiquidity = typeof body.minLiquidity === "number" && body.minLiquidity > 0
    ? body.minLiquidity : null;

  const chain = typeof body.chain === "string" && CHAINS.includes(body.chain as never)
    ? body.chain : null;

  const minPriceChange = typeof body.minPriceChange === "number" && body.minPriceChange > 0
    ? body.minPriceChange : null;

  const label = typeof body.label === "string" ? body.label.slice(0, 60) : null;

  // Cap rules per user at 10
  const count = await prisma.alertRule.count({ where: { userId: sessionId } });
  if (count >= 10) return Response.json({ error: "Maximum 10 alert rules per user" }, { status: 400 });

  const rule = await prisma.alertRule.create({
    data: { userId: sessionId, telegramChatId, minScore, minLiquidity, chain, minPriceChange, label },
  });

  return Response.json({ rule }, { status: 201 });
}
