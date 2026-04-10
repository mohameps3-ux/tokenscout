import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [total, baseCount, solanaCount, avgScoreResult, topLiqResult, lastJob] =
      await Promise.all([
        prisma.token.count(),
        prisma.token.count({ where: { chain: "BASE" } }),
        prisma.token.count({ where: { chain: "SOLANA" } }),
        prisma.token.aggregate({ _avg: { totalScore: true } }),
        prisma.token.findFirst({
          orderBy: { liquidity: "desc" },
          select: { liquidity: true },
        }),
        prisma.jobLog.findFirst({
          orderBy: { createdAt: "desc" },
          where: { status: "success" },
          select: { createdAt: true },
        }),
      ]);

    return Response.json({
      totalTokens: total,
      baseTokens: baseCount,
      solanaTokens: solanaCount,
      avgScore: Math.round(avgScoreResult._avg.totalScore ?? 0),
      topLiquidity: topLiqResult?.liquidity ?? 0,
      lastUpdated: lastJob?.createdAt?.toISOString() ?? new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API /tokens/stats] Error:", error);
    return Response.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
