import { prisma } from "@/lib/prisma";
import { fetchTokenByAddress } from "@/lib/api/dexscreener";
import { calcEloChange, applyElo, calcAccuracy, getCurrentWeekStart } from "@/lib/elo";

const TARGET_GAIN_PCT = 20; // +20% = UP wins

export async function resolveExpiredPredictions(): Promise<{
  resolved: number;
  correct: number;
  skipped: number;
}> {
  let resolved = 0;
  let correct = 0;
  let skipped = 0;

  const now = new Date();

  // Fetch all expired, unresolved predictions
  const expired = await prisma.prediction.findMany({
    where: { resolved: false, expiresAt: { lte: now } },
    include: {
      token: true,
      user: true,
    },
    take: 100, // process in batches
  });

  if (expired.length === 0) return { resolved, correct, skipped };

  // Group by token to avoid duplicate price fetches
  const tokenPriceCache = new Map<string, number | null>();

  for (const prediction of expired) {
    try {
      const { token } = prediction;

      // Get current price (cached per token)
      let currentPrice: number | null;
      if (tokenPriceCache.has(token.id)) {
        currentPrice = tokenPriceCache.get(token.id)!;
      } else {
        const pair = await fetchTokenByAddress(
          token.address,
          token.chain as "BASE" | "SOLANA"
        );
        currentPrice = pair?.priceUsd ? parseFloat(pair.priceUsd) : null;
        tokenPriceCache.set(token.id, currentPrice);
      }

      // Can't resolve without a current price — skip for now
      if (currentPrice === null || prediction.priceAtPrediction === null) {
        skipped++;
        continue;
      }

      const priceThen = prediction.priceAtPrediction;
      const changePct = ((currentPrice - priceThen) / priceThen) * 100;
      const wentUp = changePct >= TARGET_GAIN_PCT;

      const isCorrect =
        (prediction.direction === "UP" && wentUp) ||
        (prediction.direction === "DOWN" && !wentUp);

      const eloChange = calcEloChange(prediction.confidence, isCorrect);
      const newElo = applyElo(prediction.user.eloScore, eloChange);

      // Update prediction
      await prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          resolved: true,
          correct: isCorrect,
          eloChange,
          priceAtResolution: currentPrice,
          resolvedAt: now,
        },
      });

      // Update user stats
      const newTotal = prediction.user.totalPredictions + 1;
      const newCorrect = prediction.user.correctPredictions + (isCorrect ? 1 : 0);

      await prisma.user.update({
        where: { id: prediction.userId },
        data: {
          eloScore: newElo,
          totalPredictions: newTotal,
          correctPredictions: newCorrect,
        },
      });

      // Update weekly leaderboard entry
      const weekStart = getCurrentWeekStart();
      await prisma.leaderboardEntry.upsert({
        where: {
          userId_weekStart: {
            userId: prediction.userId,
            weekStart,
          },
        },
        update: {
          eloScore: newElo,
          predictions: { increment: 1 },
          accuracy: calcAccuracy(newCorrect, newTotal),
        },
        create: {
          userId: prediction.userId,
          weekStart,
          eloScore: newElo,
          predictions: 1,
          accuracy: calcAccuracy(newCorrect, newTotal),
        },
      });

      resolved++;
      if (isCorrect) correct++;
    } catch (err) {
      console.error(`[Resolver] Failed to resolve prediction ${prediction.id}:`, err);
      skipped++;
    }
  }

  // Award Alpha Caller badges to top 10 of the week
  if (resolved > 0) {
    await awardWeeklyBadges();
  }

  return { resolved, correct, skipped };
}

async function awardWeeklyBadges(): Promise<void> {
  const weekStart = getCurrentWeekStart();

  // Get top 10 for the current week
  const top10 = await prisma.leaderboardEntry.findMany({
    where: { weekStart },
    orderBy: { eloScore: "desc" },
    take: 10,
    select: { userId: true, rank: true },
  });

  // Update ranks and award badges
  for (let i = 0; i < top10.length; i++) {
    const { userId } = top10[i];
    const rank = i + 1;

    // Update rank
    await prisma.leaderboardEntry.update({
      where: { userId_weekStart: { userId, weekStart } },
      data: { rank },
    });

    // Award Alpha Caller badge to top 10
    await prisma.userBadge.upsert({
      where: { userId_badge: { userId, badge: "ALPHA_CALLER" } },
      update: { awardedAt: new Date() },
      create: { userId, badge: "ALPHA_CALLER" },
    });
  }
}
