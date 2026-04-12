import { Suspense } from "react";
import { cookies } from "next/headers";
import { Navbar } from "@/components/Navbar";
import { TokenGrid } from "@/components/dashboard/TokenGrid";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { UpgradePrompt } from "@/components/monetization/UpgradePrompt";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session";
import { PLANS } from "@/lib/stripe";
import { normalizeChain } from "@/lib/chains";
import { Zap, TrendingUp, Shield, Clock } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    chain?: string;
    minScore?: string;
    minLiquidity?: string;
    age?: string;
    sort?: string;
    page?: string;
  }>;
}

const FREE_TOKEN_LIMIT = PLANS.FREE.tokens;
const FREE_PAGE_SIZE   = FREE_TOKEN_LIMIT;
const PRO_PAGE_SIZE    = 20;

async function getStats() {
  const [total, avgResult, topLiq, lastJob] = await Promise.all([
    prisma.token.count(),
    prisma.token.aggregate({ _avg: { totalScore: true } }),
    prisma.token.findFirst({ orderBy: { liquidity: "desc" }, select: { liquidity: true } }),
    prisma.jobLog.findFirst({
      orderBy: { createdAt: "desc" },
      where: { status: "success" },
      select: { createdAt: true },
    }),
  ]);
  return {
    totalTokens: total,
    avgScore: Math.round(avgResult._avg.totalScore ?? 0),
    topLiquidity: topLiq?.liquidity ?? 0,
    lastUpdated: lastJob?.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

async function getUserTier(sessionId: string | undefined): Promise<"FREE" | "PRO"> {
  if (!sessionId) return "FREE";
  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    select: { tier: true, proExpiresAt: true },
  });
  if (!user) return "FREE";
  if (user.tier === "PRO") return "PRO";
  if (user.proExpiresAt && user.proExpiresAt > new Date()) return "PRO";
  return "FREE";
}

async function getTokens(params: Awaited<PageProps["searchParams"]>, tier: "FREE" | "PRO") {
  const isPro = tier === "PRO";
  const pageSize = isPro ? PRO_PAGE_SIZE : FREE_PAGE_SIZE;
  const chain = params.chain;
  const minScore = parseInt(params.minScore ?? "0") || 0;
  const minLiquidity = parseFloat(params.minLiquidity ?? "0") || 0;
  const age = params.age;
  const sort = params.sort ?? "score";
  const page = isPro ? (parseInt(params.page ?? "1") || 1) : 1;

  let createdAfter: Date | undefined;
  if (age === "1h") createdAfter = new Date(Date.now() - 60 * 60 * 1000);
  else if (age === "24h") createdAfter = new Date(Date.now() - 24 * 60 * 60 * 1000);
  else if (age === "7d") createdAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const normalizedChain = chain && chain !== "ALL" ? normalizeChain(chain) : null;
  const where = {
    ...(normalizedChain ? { chain: normalizedChain } : {}),
    ...(minScore > 0 ? { totalScore: { gte: minScore } } : {}),
    ...(minLiquidity > 0 ? { liquidity: { gte: minLiquidity } } : {}),
    ...(createdAfter ? { createdAt: { gte: createdAfter } } : {}),
  };

  const orderBy = (() => {
    switch (sort) {
      case "liquidity": return { liquidity: "desc" as const };
      case "volume":    return { volume24h: "desc" as const };
      case "age":       return { createdAt: "desc" as const };
      case "change":    return { priceChange24h: "desc" as const };
      default:          return { totalScore: "desc" as const };
    }
  })();

  const select = {
    id: true, address: true, chain: true, name: true, symbol: true,
    priceUsd: true, liquidity: true, marketCap: true, volume24h: true,
    priceChange24h: true, totalScore: true, liquidityScore: true,
    holderScore: true, ageScore: true, volumeScore: true, suspicionScore: true,
    isHoneypot: true, hasBundledBuys: true, listedAt: true, createdAt: true,
    pairAddress: true, dexId: true,
  };

  const [tokens, total] = await Promise.all([
    prisma.token.findMany({ where, orderBy, select, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.token.count({ where }),
  ]);

  const visibleTokens = isPro ? tokens : tokens.slice(0, FREE_TOKEN_LIMIT);
  const effectiveTotal = isPro ? total : Math.min(total, FREE_TOKEN_LIMIT);

  return {
    tokens: visibleTokens,
    total,
    visibleTotal: effectiveTotal,
    page,
    totalPages: isPro ? Math.ceil(total / pageSize) : 1,
    isPro,
    hiddenCount: isPro ? 0 : Math.max(0, total - FREE_TOKEN_LIMIT),
  };
}

export default async function ScannerPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  const [stats, tier] = await Promise.all([
    getStats().catch(() => null),
    getUserTier(sessionId),
  ]);

  const tokenData = await getTokens(params, tier).catch(() => ({
    tokens: [], total: 0, visibleTotal: 0, page: 1, totalPages: 0, isPro: false, hiddenCount: 0,
  }));

  const isEmpty = tokenData.tokens.length === 0;
  const hasNeverScanned = stats?.totalTokens === 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="text-center py-5">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            <span className="text-blue-400">Token</span>Scout Scanner
          </h1>
          <p className="mt-2 text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
            AI-scored new tokens across 10 chains. Honeypot detection, liquidity & volume analysis.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {[
              { icon: Shield, text: "Honeypot Detection" },
              { icon: TrendingUp, text: "Volume/MCap Scoring" },
              { icon: Clock, text: tier === "PRO" ? "15-min Refresh" : "6h Refresh (Free)" },
              { icon: Zap, text: "10 Networks" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800/60 border border-zinc-700 rounded-full px-3 py-1">
                <Icon className="w-3 h-3 text-blue-400" />{text}
              </span>
            ))}
          </div>
        </div>

        {stats && (
          <StatsBar
            totalTokens={stats.totalTokens}
            avgScore={stats.avgScore}
            topLiquidity={stats.topLiquidity}
            lastUpdated={stats.lastUpdated}
          />
        )}

        {hasNeverScanned && <FirstRunBanner />}

        <Suspense fallback={null}>
          <FilterBar tier={tier} />
        </Suspense>

        {isEmpty && !hasNeverScanned ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-lg">No tokens match your filters.</p>
            <p className="text-sm mt-1">Try relaxing the filters or wait for the next scan.</p>
          </div>
        ) : (
          <>
            <TokenGrid
              tokens={tokenData.tokens.map((t) => ({
                ...t,
                listedAt: t.listedAt?.toISOString() ?? null,
                createdAt: t.createdAt.toISOString(),
              }))}
              total={tokenData.visibleTotal}
              page={tokenData.page}
              totalPages={tokenData.totalPages}
              isPro={tokenData.isPro}
            />
            {!tokenData.isPro && tokenData.hiddenCount > 0 && (
              <UpgradePrompt hiddenCount={tokenData.hiddenCount} />
            )}
          </>
        )}

        <footer className="border-t border-zinc-800 pt-6 pb-4 text-center">
          <p className="text-xs text-zinc-600 max-w-2xl mx-auto">
            <strong className="text-zinc-500">Disclaimer:</strong> TokenScout scores are for research only. This is{" "}
            <strong>not financial advice</strong>. Crypto assets are highly volatile.
          </p>
        </footer>
      </main>
    </div>
  );
}

function FirstRunBanner() {
  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6 text-center space-y-3">
      <div className="flex justify-center">
        <div className="h-12 w-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
          <Zap className="h-6 w-6 text-blue-400" />
        </div>
      </div>
      <h2 className="text-lg font-semibold text-white">No tokens yet — trigger your first scan</h2>
      <p className="text-sm text-zinc-400 max-w-md mx-auto">
        The database is empty. Click below to fetch the latest tokens from DexScreener and GeckoTerminal.
      </p>
      <form action="/api/tokens/scan" method="POST">
        <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
          <Zap className="w-4 h-4" />Scan Now
        </button>
      </form>
    </div>
  );
}
