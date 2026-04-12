import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session";
import { CHAINS } from "@/lib/chains";

export const dynamic = "force-dynamic";

// Rule limits by tier
const TIER_RULE_LIMIT: Record<string, number> = {
  FREE: 1,
  PRO: 3,
  SUPER_PRO: Infinity,
};

function getRuleLimit(tier: string): number {
  return TIER_RULE_LIMIT[tier] ?? 1;
}

// GET /api/alerts — list this user's alert rules
export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return Response.json({ error: "No session" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    select: { tier: true },
  });

  const rules = await prisma.alertRule.findMany({
    where: { userId: sessionId },
    orderBy: { createdAt: "desc" },
  });

  const limit = getRuleLimit(user?.tier ?? "FREE");

  return Response.json({
    rules,
    tier: user?.tier ?? "FREE",
    limit: limit === Infinity ? null : limit,
  });
}

// POST /api/alerts — create a new alert rule
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return Response.json({ error: "No session" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    select: { tier: true },
  });
  const tier = user?.tier ?? "FREE";
  const limit = getRuleLimit(tier);

  const body = await request.json().catch(() => ({}));

  const telegramChatId =
    typeof body.telegramChatId === "string" ? body.telegramChatId.trim() : null;
  if (!telegramChatId)
    return Response.json({ error: "telegramChatId is required" }, { status: 400 });

  const minScore =
    typeof body.minScore === "number"
      ? Math.min(100, Math.max(0, Math.round(body.minScore)))
      : 70;

  const minAiScore =
    typeof body.minAiScore === "number"
      ? Math.min(100, Math.max(0, Math.round(body.minAiScore)))
      : 0;

  const minLiquidity =
    typeof body.minLiquidity === "number" && body.minLiquidity > 0
      ? body.minLiquidity
      : null;

  const chain =
    typeof body.chain === "string" && CHAINS.includes(body.chain as never)
      ? body.chain
      : null;

  const minPriceChange =
    typeof body.minPriceChange === "number" && body.minPriceChange > 0
      ? body.minPriceChange
      : null;

  const label =
    typeof body.label === "string" ? body.label.slice(0, 60) : null;

  // Enforce tier limit
  const count = await prisma.alertRule.count({ where: { userId: sessionId } });
  if (limit !== Infinity && count >= limit) {
    return Response.json(
      {
        error:
          tier === "FREE"
            ? "Free users can only have 1 alert rule. Upgrade to Pro for more."
            : `${tier} users can have up to ${limit} alert rules.`,
        upgradeRequired: true,
      },
      { status: 403 }
    );
  }

  const rule = await prisma.alertRule.create({
    data: {
      userId: sessionId,
      telegramChatId,
      minScore,
      minAiScore,
      minLiquidity,
      chain,
      minPriceChange,
      label,
    },
  });

  return Response.json({ rule }, { status: 201 });
}
