export const runtime = 'nodejs';

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
