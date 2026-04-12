import { prisma } from "@/lib/prisma";
import { getCurrentWeekStart } from "@/lib/elo";

export async function GET() {
  const weekStart = getCurrentWeekStart();

  const [weeklyEntries, allTimeTop] = await Promise.all([
    // Weekly leaderboard (current week)
    prisma.leaderboardEntry.findMany({
      where: { weekStart },
      orderBy: { eloScore: "desc" },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            totalPredictions: true,
            correctPredictions: true,
            badges: { select: { badge: true } },
          },
        },
      },
    }),

    // All-time top 10 by ELO
    prisma.user.findMany({
      where: { totalPredictions: { gt: 0 } },
      orderBy: { eloScore: "desc" },
      take: 10,
      select: {
        id: true,
        username: true,
        eloScore: true,
        totalPredictions: true,
        correctPredictions: true,
        badges: { select: { badge: true } },
      },
    }),
  ]);

  return Response.json({
    weekStart: weekStart.toISOString(),
    weekly: weeklyEntries.map((entry, idx) => ({
      rank: idx + 1,
      userId: entry.userId,
      username: entry.user.username,
      eloScore: entry.eloScore,
      predictions: entry.predictions,
      accuracy: entry.accuracy,
      badges: entry.user.badges.map((b) => b.badge),
      isAlphaCaller: entry.user.badges.some((b) => b.badge === "ALPHA_CALLER"),
    })),
    allTime: allTimeTop.map((user, idx) => ({
      rank: idx + 1,
      userId: user.id,
      username: user.username,
      eloScore: user.eloScore,
      totalPredictions: user.totalPredictions,
      correctPredictions: user.correctPredictions,
      accuracy:
        user.totalPredictions > 0
          ? Math.round((user.correctPredictions / user.totalPredictions) * 1000) / 10
          : 0,
      badges: user.badges.map((b) => b.badge),
      isAlphaCaller: user.badges.some((b) => b.badge === "ALPHA_CALLER"),
    })),
  });
}
