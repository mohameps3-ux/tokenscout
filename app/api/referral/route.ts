import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate unique referral code");
}

// GET /api/referral — get current user's referral info
export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return Response.json({ error: "No session" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    select: { id: true, referralCode: true, points: true, proExpiresAt: true },
  });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  // Auto-generate referral code on first request
  let code = user.referralCode;
  if (!code) {
    code = await generateUniqueCode();
    await prisma.user.update({ where: { id: sessionId }, data: { referralCode: code } });
  }

  const referralCount = await prisma.user.count({ where: { referredBy: sessionId } });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const points = user.points;
  const nextReward =
    points < 500  ? { threshold: 500,  reward: "1 week Pro",   needed: 500  - points } :
    points < 2000 ? { threshold: 2000, reward: "1 month Pro",  needed: 2000 - points } :
    null;

  return Response.json({
    referralCode: code,
    referralLink: `${baseUrl}/r/${code}`,
    points,
    referralCount,
    proExpiresAt: user.proExpiresAt?.toISOString() ?? null,
    nextReward,
  });
}

// POST /api/referral — claim a referral code
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return Response.json({ error: "No session" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : null;
  if (!code) return Response.json({ error: "Missing referral code" }, { status: 400 });

  const [claimingUser, referrer] = await Promise.all([
    prisma.user.findUnique({ where: { id: sessionId }, select: { referredBy: true, referralCode: true } }),
    prisma.user.findUnique({ where: { referralCode: code }, select: { id: true, points: true, proExpiresAt: true } }),
  ]);

  if (!claimingUser) return Response.json({ error: "User not found" }, { status: 404 });
  if (claimingUser.referredBy) return Response.json({ error: "You have already used a referral code" }, { status: 400 });
  if (!referrer) return Response.json({ error: "Invalid referral code" }, { status: 404 });
  if (referrer.id === sessionId) return Response.json({ error: "You cannot use your own referral code" }, { status: 400 });

  // Grant 100 points to referrer + check reward thresholds
  const oldPoints = referrer.points;
  const newPoints = oldPoints + 100;
  let proExpiresAt = referrer.proExpiresAt;

  if (oldPoints < 500 && newPoints >= 500) {
    const base = proExpiresAt && proExpiresAt > new Date() ? proExpiresAt : new Date();
    proExpiresAt = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  if (oldPoints < 2000 && newPoints >= 2000) {
    const base = proExpiresAt && proExpiresAt > new Date() ? proExpiresAt : new Date();
    proExpiresAt = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  await Promise.all([
    prisma.user.update({ where: { id: referrer.id }, data: { points: newPoints, proExpiresAt } }),
    prisma.user.update({ where: { id: sessionId }, data: { referredBy: referrer.id } }),
  ]);

  return Response.json({ success: true, pointsGranted: 100 });
}
