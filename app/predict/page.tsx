import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { getAiPrediction } from "@/lib/ai-predictor";
import { PredictButton } from "@/components/predictions/PredictButton";
import { Leaderboard } from "@/components/predictions/Leaderboard";
import { MyStats } from "@/components/predictions/MyStats";
import { getScoreLabel } from "@/lib/scoring/scorer";
import { formatUsd, formatPercent, formatAge, truncateAddress } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";
import { Bot, Trophy, Target, Zap, AlertTriangle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getPredictableTokens() {
  // Surface tokens with decent scores for prediction
  return prisma.token.findMany({
    where: {
      totalScore: { gte: 30 },
      priceUsd: { gt: 0 },
      isHoneypot: false,
    },
    orderBy: [{ totalScore: "desc" }, { volume24h: "desc" }],
    take: 24,
    select: {
      id: true,
      address: true,
      chain: true,
      name: true,
      symbol: true,
      priceUsd: true,
      liquidity: true,
      marketCap: true,
      volume24h: true,
      priceChange24h: true,
      totalScore: true,
      liquidityScore: true,
      holderScore: true,
      volumeScore: true,
      suspicionScore: true,
      ageScore: true,
      isHoneypot: true,
      hasBundledBuys: true,
      listedAt: true,
      pairAddress: true,
    },
  });
}

async function getUserActivePredictions(userId: string) {
  const preds = await prisma.prediction.findMany({
    where: { userId, resolved: false },
    select: { tokenId: true, direction: true, resolved: true },
  });
  return Object.fromEntries(preds.map((p) => [p.tokenId, p]));
}

export default async function PredictPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  const emptyPreds: Record<string, { direction: string; resolved: boolean }> = {};
  const [tokens, activePreds] = await Promise.all([
    getPredictableTokens(),
    sessionId ? getUserActivePredictions(sessionId) : Promise.resolve(emptyPreds),
  ]);

  const hasTokens = tokens.length > 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero */}
        <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-blue-500/5 p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                  <Target className="h-4 w-4 text-violet-400" />
                </div>
                <h1 className="text-xl font-bold text-white">Prediction Arena</h1>
                <Badge variant="outline" className="text-violet-400 border-violet-500/40">Free to Play</Badge>
              </div>
              <p className="text-sm text-zinc-400 max-w-md">
                Pick tokens to go <span className="text-emerald-400 font-medium">UP +20%</span> or{" "}
                <span className="text-red-400 font-medium">DOWN</span> in 4 hours.
                Climb the ELO leaderboard — top 10 weekly earns the{" "}
                <span className="text-violet-400 font-medium">Alpha Caller</span> badge.
              </p>
            </div>
            <div className="flex gap-3 text-center">
              <div className="rounded-lg bg-zinc-900/60 border border-zinc-800 px-4 py-2">
                <p className="text-lg font-bold text-white">4h</p>
                <p className="text-[10px] text-zinc-500">window</p>
              </div>
              <div className="rounded-lg bg-zinc-900/60 border border-zinc-800 px-4 py-2">
                <p className="text-lg font-bold text-violet-400">+20%</p>
                <p className="text-[10px] text-zinc-500">target</p>
              </div>
              <div className="rounded-lg bg-zinc-900/60 border border-zinc-800 px-4 py-2">
                <p className="text-lg font-bold text-yellow-400">ELO</p>
                <p className="text-[10px] text-zinc-500">scoring</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI banner */}
        <div className="flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm text-zinc-400">
          <Bot className="w-4 h-4 text-violet-400 shrink-0" />
          <span>
            <span className="text-white font-medium">Vs AI mode active</span> — every card shows the AI's pick.
            Agree or contradict — but your ELO is always on the line.
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Token prediction cards */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                {hasTokens ? `${tokens.length} tokens to predict` : "No tokens available"}
              </h2>
              <Link href="/" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                View scanner →
              </Link>
            </div>

            {!hasTokens ? (
              <div className="text-center py-20 text-zinc-500 border border-zinc-800 rounded-xl">
                <Zap className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p>No tokens scanned yet.</p>
                <Link href="/api/tokens/scan" className="text-blue-400 text-sm mt-2 inline-block hover:underline">
                  Trigger a scan →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tokens.map((token) => (
                  <PredictTokenCard
                    key={token.id}
                    token={token}
                    existingPrediction={activePreds[token.id] ?? null}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: stats + leaderboard */}
          <div className="space-y-4">
            {/* My Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-blue-400" />
                  My Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-24 w-full" />}>
                  <MyStats />
                </Suspense>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Leaderboard currentUserId={sessionId} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Legal disclaimer */}
        <footer className="border-t border-zinc-800 pt-6 pb-4 text-center">
          <p className="text-xs text-zinc-600 max-w-2xl mx-auto">
            <strong className="text-zinc-500">Disclaimer:</strong> TokenScout predictions are for{" "}
            <strong>entertainment and research only</strong>. Not financial advice. Scores and predictions
            do not constitute investment recommendations. Crypto assets are highly volatile.
          </p>
        </footer>
      </main>
    </div>
  );
}

function PredictTokenCard({
  token,
  existingPrediction,
}: {
  token: Awaited<ReturnType<typeof getPredictableTokens>>[number];
  existingPrediction: { direction: string; resolved: boolean } | null;
}) {
  const { color, bg } = getScoreLabel(token.totalScore);
  const priceUp = (token.priceChange24h ?? 0) >= 0;
  const aiPrediction = getAiPrediction(token);

  return (
    <div className={`rounded-xl border bg-zinc-900/70 p-4 flex flex-col gap-3 ${bg}`}>
      {/* Token header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white">{token.symbol}</span>
            <Badge variant={token.chain === "BASE" ? "default" : "success"}>
              {token.chain}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 truncate mt-0.5">{token.name}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-zinc-500">Score</p>
          <p className={`text-sm font-bold ${color}`}>{token.totalScore}</p>
        </div>
      </div>

      {/* Price row */}
      <div className="flex items-center gap-4 text-xs">
        <div>
          <p className="text-zinc-600">Price</p>
          <p className="text-white font-medium">{formatUsd(token.priceUsd)}</p>
        </div>
        <div>
          <p className="text-zinc-600">24h</p>
          <p className={priceUp ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
            {formatPercent(token.priceChange24h)}
          </p>
        </div>
        <div>
          <p className="text-zinc-600">Age</p>
          <p className="text-zinc-300">{formatAge(token.listedAt ? new Date(token.listedAt) : null)}</p>
        </div>
        <div>
          <p className="text-zinc-600">Liq</p>
          <p className="text-zinc-300">{formatUsd(token.liquidity, true)}</p>
        </div>
      </div>

      {/* Predict buttons */}
      <PredictButton
        tokenId={token.id}
        tokenSymbol={token.symbol}
        aiPrediction={aiPrediction}
        existingPrediction={existingPrediction}
      />
    </div>
  );
}
