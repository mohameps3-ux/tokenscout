import { NextRequest } from "next/server";
import { isTelegramConfigured, sendTokenAlert } from "@/lib/telegram";
import { prisma } from "@/lib/prisma";

// POST /api/telegram/test — manually send a test alert for a token
export async function POST(request: NextRequest) {
  if (!isTelegramConfigured()) {
    return Response.json(
      { error: "Telegram not configured. Add TELEGRAM_BOT_TOKEN to .env.local" },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const chatId = body.chatId as string | undefined;
  const tokenId = body.tokenId as string | undefined;

  // If a specific token is requested, use it; otherwise pick highest-scored
  const token = tokenId
    ? await prisma.token.findUnique({ where: { id: tokenId } })
    : await prisma.token.findFirst({
        where: { totalScore: { gte: 80 } },
        orderBy: { totalScore: "desc" },
      });

  if (!token) {
    return Response.json({ error: "No eligible token found (need score ≥ 80)" }, { status: 404 });
  }

  const sent = await sendTokenAlert(token, chatId);
  return Response.json({ sent, token: { symbol: token.symbol, score: token.totalScore } });
}

// GET /api/telegram — status check
export async function GET() {
  return Response.json({
    configured: isTelegramConfigured(),
    chatId: process.env.TELEGRAM_ALERT_CHAT_ID ? "set" : "not set",
  });
}
