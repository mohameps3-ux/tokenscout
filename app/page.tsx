import { Navbar } from "@/components/Navbar";
import { TickerBar } from "@/components/market/TickerBar";
import { MarketStatsBar } from "@/components/market/MarketStatsBar";
import { TrendingSection } from "@/components/market/TrendingSection";
import { DexTrendingSection } from "@/components/market/DexTrendingSection";
import { CoinTable } from "@/components/market/CoinTable";
import { MarketIndicators } from "@/components/market/MarketIndicators";
import { TokenNarratives } from "@/components/market/TokenNarratives";

async function getMarketData() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
  try {
    const res = await fetch(`${base}/api/market`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const market = await getMarketData();
  const coins   = market?.coins   ?? [];
  const global_ = market?.global  ?? null;
  const trending = market?.trending ?? [];
  const fearGreed = market?.fearGreed ?? null;
  const fearGreedHistory = market?.fearGreedHistory ?? [];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Scrolling price ticker */}
      {coins.length > 0 && <TickerBar coins={coins} />}

      {/* Market stats bar */}
      <MarketStatsBar
        global={global_}
        fearGreed={fearGreed}
        fearGreedHistory={fearGreedHistory}
        lastUpdated={new Date()}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-8">

        {/* Hero */}
        <div className="text-center py-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Crypto <span className="text-blue-400">Market</span> Overview
          </h1>
          <p className="mt-2 text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
            Live prices, market cap rankings, and trend data — updated every 60 seconds.
          </p>
        </div>

        {/* CoinGecko Trending */}
        {trending.length > 0 && <TrendingSection trending={trending} />}

        {/* Hot Tokens */}
        <DexTrendingSection />

        {/* Market Cycle Indicators */}
        <MarketIndicators />

        {/* Token Narratives */}
        <TokenNarratives />

        {/* Main table */}
        {coins.length > 0 ? (
          <CoinTable initialCoins={coins} />
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
            <p className="text-zinc-500 text-sm">Market data unavailable — CoinGecko API may be rate-limiting.</p>
            <p className="text-zinc-600 text-xs mt-1">Data will appear once the rate limit resets (typically within 1 minute).</p>
          </div>
        )}

        <footer className="border-t border-zinc-800 pt-6 pb-4 text-center">
          <p className="text-xs text-zinc-600 max-w-2xl mx-auto">
            Market data provided by{" "}
            <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-400 underline underline-offset-2">CoinGecko</a>
            {" "}and{" "}
            <a href="https://alternative.me/crypto/fear-and-greed-index/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-400 underline underline-offset-2">Alternative.me</a>.
            {" "}Not financial advice.
          </p>
        </footer>
      </main>
    </div>
  );
}

export const metadata = {
  title: "Crypto Market Overview | TokenScout",
  description: "Live cryptocurrency prices, market cap rankings, trending coins, and market stats.",
};
