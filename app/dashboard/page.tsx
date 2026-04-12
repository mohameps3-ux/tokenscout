export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { Leaderboard } from "@/components/predictions/Leaderboard";
import { MyStats } from "@/components/predictions/MyStats";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUsd, formatPercent, formatAge, formatNumber, truncateAddress } from "@/lib/utils";
import { getScoreLabel } from "@/lib/scoring/scorer";
import { getCurrentWeekStart } from "@/lib/elo";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3, Activity, Trophy, Target, Bot } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

async function getDashboardData() {
  const [topTokens, recentTokens, honeypotCount, jobLogs, chainBreakdown, scoreDistribution] =
    await Promise.all([
      prisma.token.findMany({
        orderBy: { totalScore: "desc" },
        take: 10,
        select: {
          id: true, address: true, chain: true, name: true, symbol: true,
          priceUsd: true, liquidity: true, marketCap: true, volume24h: true,
          priceChange24h: true, totalScore: true, liquidityScore: true,
          holderScore: true, ageScore: true, volumeScore: true,
          suspicionScore: true, isHoneypot: true, hasBundledBuys: true,
          listedAt: true, pairAddress: true,
        },
      }),
      prisma.token.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true, address: true, chain: true, name: true, symbol: true,
          priceUsd: true, liquidity: true, totalScore: true, priceChange24h: true,
          createdAt: true, listedAt: true,
        },
      }),
      prisma.token.count({ where: { isHoneypot: true } }),
      prisma.jobLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
      prisma.token.groupBy({ by: ["chain"], _count: { _all: true } }),
      Promise.all([
        prisma.token.count({ where: { totalScore: { gte: 75 } } }),
        prisma.token.count({ where: { totalScore: { gte: 50, lt: 75 } } }),
        prisma.token.count({ where: { totalScore: { gte: 25, lt: 50 } } }),
        prisma.token.count({ where: { totalScore: { lt: 25 } } }),
      ]),
    ]);

  const chainCounts = Object.fromEntries(chainBreakdown.map((r) => [r.chain, r._count._all]));
  return {
    topTokens, recentTokens, honeypotCount, jobLogs,
    chainCounts,
    strongCount: scoreDistribution[0],
    decentCount: scoreDistribution[1],
    weakCount: scoreDistribution[2],
    riskyCount: scoreDistribution[3],
  };
}

async function getPredictionStats() {
  const weekStart = getCurrentWeekStart();
  const [totalPredictions, resolved, correct, weeklyPlayers] = await Promise.all([
    prisma.prediction.count(),
    prisma.prediction.count({ where: { resolved: true } }),
    prisma.prediction.count({ where: { resolved: true, correct: true } }),
    prisma.leaderboardEntry.count({ where: { weekStart } }),
  ]);
  return {
    totalPredictions,
    resolved,
    accuracy: resolved > 0 ? Math.round((correct / resolved) * 100) : 0,
    weeklyPlayers,
  };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { tab: tabParam } = await searchParams;
  const tab = tabParam === "predictions" ? "predictions" : "scanner";

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  const [scannerData, predStats] = await Promise.all([
    getDashboardData().catch(() => null),
    getPredictionStats().catch(() => null),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Token intelligence & prediction overview</p>
          </div>
          <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View Scanner →
          </Link>
        </div>

        {/* Top stat row — always visible */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {scannerData && (
            <>
              <StatTile label="Strong Tokens" value={formatNumber(scannerData.strongCount)} color="text-emerald-400" />
              <StatTile label="Honeypots" value={formatNumber(scannerData.honeypotCount)} color="text-red-400" />
              {Object.entries(scannerData.chainCounts).map(([chain, count]) => (
                <StatTile key={chain} label={chain} value={formatNumber(count as number)} color="text-blue-400" />
              ))}
            </>
          )}
          {predStats && (
            <>
              <StatTile label="Predictions" value={formatNumber(predStats.totalPredictions)} color="text-yellow-400" />
              <StatTile label="Avg Accuracy" value={`${predStats.accuracy}%`} color="text-violet-400" />
              <StatTile label="Weekly Players" value={formatNumber(predStats.weeklyPlayers)} color="text-cyan-400" />
            </>
          )}
        </div>

        {/* Tabbed content */}
        <Suspense fallback={null}>
          <DashboardTabs activeTab={tab}>
            {tab === "scanner" ? (
              <ScannerTab data={scannerData} />
            ) : (
              <PredictionsTab sessionId={sessionId} />
            )}
          </DashboardTabs>
        </Suspense>

        {/* Disclaimer */}
        <footer className="border-t border-zinc-800 pt-6 pb-4 text-center">
          <p className="text-xs text-zinc-600 max-w-2xl mx-auto">
            <strong className="text-zinc-500">Disclaimer:</strong> TokenScout scores and predictions are for{" "}
            <strong>entertainment and research only</strong>. Not financial advice. Crypto is volatile — DYOR.
          </p>
        </footer>
      </main>
    </div>
  );
}

// ─── Scanner Tab ─────────────────────────────────────────────────────────────

function ScannerTab({ data }: { data: Awaited<ReturnType<typeof getDashboardData>> | null }) {
  if (!data) {
    return (
      <div className="text-center py-20 text-zinc-500">Failed to load scanner data.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top tokens table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                Top Scoring Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {data.topTokens.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-8">
                    No tokens scanned yet.{" "}
                    <Link href="/" className="text-blue-400 hover:underline">Go to scanner →</Link>
                  </p>
                ) : (
                  data.topTokens.map((token, idx) => (
                    <TopTokenRow key={token.id} token={token} rank={idx + 1} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Chain Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(data.chainCounts).map(([chain, count]) => {
                  const total = Object.values(data.chainCounts).reduce((s, n) => s + (n as number), 0);
                  return <ChainBar key={chain} label={chain} count={count as number} total={total} color="bg-blue-500" />;
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Score Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Strong (75+)", count: data.strongCount, color: "text-emerald-400" },
                  { label: "Decent (50–74)", count: data.decentCount, color: "text-blue-400" },
                  { label: "Weak (25–49)", count: data.weakCount, color: "text-yellow-400" },
                  { label: "Risky (0–24)", count: data.riskyCount, color: "text-red-400" },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex justify-between">
                    <span className={color}>{label}</span>
                    <span className="text-zinc-400 tabular-nums">{formatNumber(count)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                Recent Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.jobLogs.length === 0 ? (
                  <p className="text-xs text-zinc-600">No scans recorded yet.</p>
                ) : (
                  data.jobLogs.map((log) => (
                    <div key={log.id} className="flex items-start justify-between text-xs gap-2">
                      <div className="min-w-0">
                        <span className={log.status === "success" ? "text-emerald-400" : "text-red-400"}>
                          {log.status === "success" ? "✓" : "✗"}
                        </span>
                        <span className="text-zinc-400 ml-1.5">{log.jobName}</span>
                        {log.message && <p className="text-zinc-600 truncate">{log.message}</p>}
                      </div>
                      <span className="text-zinc-600 shrink-0">
                        {log.duration ? `${log.duration}ms` : ""}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent tokens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Recently Discovered
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.recentTokens.map((token) => (
              <RecentTokenCard key={token.id} token={token} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Predictions Tab ──────────────────────────────────────────────────────────

function PredictionsTab({ sessionId }: { sessionId?: string }) {
  return (
    <div className="space-y-4">
      {/* CTA to predict page */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-violet-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Ready to play?</p>
            <p className="text-xs text-zinc-400">Pick tokens, beat the AI, climb the ELO board.</p>
          </div>
        </div>
        <Link
          href="/predict"
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
        >
          <Target className="w-4 h-4" />
          Predict Now
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-blue-400" />
              My Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-32 w-full" />}>
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
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${color}`}>{value}</p>
    </div>
  );
}

function TopTokenRow({ token, rank }: {
  token: {
    id: string; address: string; chain: string; name: string; symbol: string;
    priceUsd: number | null; liquidity: number | null; volume24h: number | null;
    priceChange24h: number | null; totalScore: number;
    liquidityScore: number; holderScore: number; ageScore: number;
    volumeScore: number; suspicionScore: number;
    isHoneypot: boolean; hasBundledBuys: boolean;
    listedAt: Date | null; pairAddress: string | null;
  };
  rank: number;
}) {
  const { color } = getScoreLabel(token.totalScore);
  const priceUp = (token.priceChange24h ?? 0) >= 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/40 transition-colors">
      <span className="text-xs text-zinc-600 w-5 text-right tabular-nums">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white">{token.symbol}</span>
          <Badge variant={token.chain === "BASE" ? "default" : "success"} className="text-[10px]">
            {token.chain}
          </Badge>
          {token.isHoneypot && (
            <Badge variant="danger" className="text-[10px]">
              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />HP
            </Badge>
          )}
        </div>
        <p className="text-xs text-zinc-600 truncate">{truncateAddress(token.address)}</p>
      </div>
      <div className="text-right hidden sm:block">
        <p className="text-[10px] text-zinc-500">Liq</p>
        <p className="text-xs text-white">{formatUsd(token.liquidity, true)}</p>
      </div>
      <div className="text-right hidden md:block">
        <p className="text-[10px] text-zinc-500">24h</p>
        <p className={`text-xs flex items-center justify-end gap-0.5 ${priceUp ? "text-emerald-400" : "text-red-400"}`}>
          {priceUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {formatPercent(token.priceChange24h)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[10px] text-zinc-500">Score</p>
        <p className={`text-sm font-bold ${color}`}>{token.totalScore}</p>
      </div>
    </div>
  );
}

function RecentTokenCard({ token }: {
  token: {
    id: string; address: string; chain: string; name: string; symbol: string;
    priceUsd: number | null; liquidity: number | null; totalScore: number;
    priceChange24h: number | null; createdAt: Date; listedAt: Date | null;
  };
}) {
  const { color } = getScoreLabel(token.totalScore);
  const priceUp = (token.priceChange24h ?? 0) >= 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-sm">{token.symbol}</span>
          <Badge variant={token.chain === "BASE" ? "default" : "success"} className="text-[10px]">
            {token.chain}
          </Badge>
        </div>
        <p className="text-xs text-zinc-600">{formatAge(token.listedAt ?? token.createdAt)} old</p>
      </div>
      <div className="text-right">
        <span className={`text-sm font-bold ${color}`}>{token.totalScore}</span>
        <p className={`text-xs ${priceUp ? "text-emerald-400" : "text-red-400"}`}>
          {formatPercent(token.priceChange24h)}
        </p>
      </div>
    </div>
  );
}

function ChainBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-500">{formatNumber(count)}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-700/60 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
