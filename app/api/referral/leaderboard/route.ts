import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/referral/leaderboard — top referrers by points
export async function GET() {
  const topUsers = await prisma.user.findMany({
    where: { points: { gt: 0 } },
    orderBy: { points: "desc" },
    take: 20,
    select: { id: true, username: true, points: true, referralCode: true, createdAt: true },
  });

  // Get referral counts in a single query using groupBy
  const referralCounts = await prisma.user.groupBy({
    by: ["referredBy"],
    where: { referredBy: { in: topUsers.map((u) => u.id) } },
    _count: { _all: true },
  });
  const countMap = Object.fromEntries(
    referralCounts.map((r) => [r.referredBy!, r._count._all])
  );

  return Response.json({
    leaderboard: topUsers.map((u, i) => ({
      rank: i + 1,
      username: u.username ?? "Anonymous",
      points: u.points,
      referrals: countMap[u.id] ?? 0,
      code: u.referralCode,
    })),
  });
}
