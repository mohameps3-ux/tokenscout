"use client";

import { useRouter, usePathname } from "next/navigation";
import { PriceChart } from "@/components/token/PriceChart";
import { CopyAddress } from "@/components/token/CopyAddress";
import { ScoreBar, ScoreBreakdown } from "@/components/dashboard/ScoreBar";
import { Badge } from "@/components/ui/badge";
import { formatUsd, formatPercent, formatAge, formatNumber } from "@/lib/utils";
import { getScoreLabel } from "@/lib/scoring/scorer";
import {
  TrendingUp, TrendingDown, Globe, Send, ExternalLink,
  AlertTriangle, Shield, Zap,
} from "lucide-react";

interface Pool {
  dex: string;
  pairAddress: string;
  quoteSymbol: string;
  liquidityUsd: number;
  volume24h: number;
  url: string;
}

interface Score {
  total: number;
  liquidity: number;
  holder: number;
  age: number;
  volume: number;
  suspicion: number;
  isHoneypot: boolean;
  hasBundledBuys: boolean;
}

interface TokenData {
  address: string;
  chain: string;
  name: string | null;
  symbol: string | null;
  imageUrl: string | null;
  priceUsd: number | null;
  priceChange: { h1: number; h6: number; h24: number } | null;
  marketCap: number | null;
  fdv: number | null;
  totalSupply: number | null;
  volume24h: number | null;
  txns24h: { buys: number; sells: number } | null;
  liquidity: number | null;
  pairAddress: string | null;
  pools: Pool[];
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  description: string | null;
  pairCreatedAt: number | null;
  listedAt: string | null;
  ohlcv: [number, number, number, number, number, number][] | null;
  score: Score | null;
}

interface TokenDetailClientProps {
  data: TokenData;
  currentTimeframe: string;
}

const TIMEFRAMES = [
  { label: "1H", value: "1h" },
  { label: "4H", value: "4h" },
  { label: "1D", value: "1d" },
];

const EXPLORER: Record<string, { name: string; url: (a: string) => string }> = {
  BASE:   { name: "Basescan",  url: (a) => `https://basescan.org/token/${a}` },
  SOLANA: { name: "Solscan",   url: (a) => `https://solscan.io/token/${a}` },
};

function tradeLinks(chain: string, address: string, pairAddress: string | null) {
  if (chain === "SOLANA") return [
    { label: "Jupiter",  url: `https://jup.ag/swap/SOL-${address}`,              color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
    { label: "Raydium",  url: `https://raydium.io/swap/?outputCurrency=${address}`, color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  ];
  return [
    { label: "Uniswap",  url: pairAddress ? `https://app.uniswap.org/explore/pools/base/${pairAddress}` : `https://app.uniswap.org/swap?outputCurrency=${address}&chain=base`, color: "text-pink-400 border-pink-500/30 bg-pink-500/10" },
    { label: "Aerodrome", url: `https://aerodrome.finance/swap?from=eth&to=${address}`, color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  ];
}

function StatCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
      {sub && <p className="text-xs text-zinc-600">{sub}</p>}
    </div>
  );
}

export function TokenDetailClient({ data, currentTimeframe }: TokenDetailClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    address, chain, name, symbol, priceUsd, priceChange,
    marketCap, fdv, totalSupply, volume24h, txns24h, liquidity,
    pairAddress, pools, website, twitter, telegram, description,
    pairCreatedAt, listedAt, ohlcv, score, imageUrl,
  } = data;

  const change24h = priceChange?.h24 ?? null;
  const priceUp   = (change24h ?? 0) >= 0;
  const scoreLabel = score ? getScoreLabel(score.total) : null;
  const explorer   = EXPLORER[chain] ?? EXPLORER.BASE;
  const trades     = tradeLinks(chain, address, pairAddress);
  const listedDate = listedAt ? new Date(listedAt) : pairCreatedAt ? new Date(pairCreatedAt) : null;

  const setTimeframe = (tf: string) => {
    router.push(`${pathname}?timeframe=${tf}`);
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={symbol ?? ""} className="w-8 h-8 rounded-full object-cover" />
            )}
            <h1 className="text-2xl font-bold text-white">{name ?? "Unknown"}</h1>
            <span className="text-lg text-zinc-500">{symbol ?? "???"}</span>
            <Badge variant={chain === "BASE" ? "default" : "success"}>{chain}</Badge>
            {score?.isHoneypot   && <Badge variant="danger"><AlertTriangle className="w-3 h-3 mr-1" />Honeypot</Badge>}
            {score?.hasBundledBuys && <Badge variant="warning">Bundled Buys</Badge>}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-3xl font-bold text-white">
              {priceUsd != null ? formatUsd(priceUsd) : "—"}
            </span>
            {change24h != null && (
              <span className={`flex items-center gap-1 text-sm font-medium ${priceUp ? "text-emerald-400" : "text-red-400"}`}>
                {priceUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {formatPercent(change24h)}
                <span className="text-zinc-600 font-normal">24h</span>
              </span>
            )}
            {scoreLabel && score && (
              <span className={`text-sm font-semibold ${scoreLabel.color}`}>
                Score {score.total}/100
              </span>
            )}
          </div>
        </div>

        {/* Trade buttons */}
        <div className="flex flex-wrap gap-2 shrink-0">
          {trades.map(({ label, url, color }) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium hover:opacity-80 transition-opacity ${color}`}>
              <Zap className="w-3.5 h-3.5" />{label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Contract address ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Contract Address</p>
        <CopyAddress
          address={address}
          explorerUrl={explorer.url(address)}
          explorerLabel={explorer.name}
        />
      </div>

      {/* ── Chart + stats grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
          {/* Timeframe buttons */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400 font-medium">{symbol ?? ""}/USD</span>
            <div className="flex gap-1">
              {TIMEFRAMES.map(({ label, value }) => (
                <button key={value} onClick={() => setTimeframe(value)}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    currentTimeframe === value
                      ? "bg-blue-600 text-white"
                      : "text-zinc-400 bg-zinc-800 hover:bg-zinc-700 hover:text-white"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {ohlcv && ohlcv.length > 0 ? (
            <PriceChart ohlcv={ohlcv} />
          ) : (
            <div className="h-72 flex items-center justify-center text-zinc-600 text-sm">
              No chart data available
            </div>
          )}
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Market Data</p>
            <div className="grid grid-cols-2 gap-4">
              <StatCell label="Market Cap"  value={formatUsd(marketCap, true)} />
              <StatCell label="FDV"         value={formatUsd(fdv, true)} />
              <StatCell label="Liquidity"   value={formatUsd(liquidity, true)} />
              <StatCell label="Volume 24h"  value={formatUsd(volume24h, true)} />
              <StatCell label="Age"         value={formatAge(listedDate)} />
              {txns24h && (
                <StatCell label="Txns 24h"
                  value={String(txns24h.buys + txns24h.sells)}
                  sub={`${txns24h.buys}B / ${txns24h.sells}S`}
                />
              )}
              {totalSupply != null && (
                <StatCell label="Total Supply" value={formatNumber(totalSupply)} />
              )}
              {priceChange?.h1 != null && (
                <StatCell label="1h Change" value={formatPercent(priceChange.h1)} />
              )}
            </div>
          </div>

          {/* Score breakdown */}
          {score && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Safety Score</p>
                <ScoreBar score={score.total} size="sm" showLabel />
              </div>
              <ScoreBreakdown
                liquidityScore={score.liquidity}
                holderScore={score.holder}
                ageScore={score.age}
                volumeScore={score.volume}
                suspicionScore={score.suspicion}
              />
              {score.isHoneypot && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />Honeypot pattern detected
                </div>
              )}
              {!score.isHoneypot && score.suspicion >= 8 && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                  <Shield className="w-3.5 h-3.5 shrink-0" />No suspicious patterns detected
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── All Pools ── */}
      {pools.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-sm font-semibold text-white">All Liquidity Pools</p>
            <p className="text-xs text-zinc-500 mt-0.5">{pools.length} pool{pools.length !== 1 ? "s" : ""} found</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800/60">
                  <th className="px-4 py-2.5 font-medium">DEX</th>
                  <th className="px-4 py-2.5 font-medium">Pair</th>
                  <th className="px-4 py-2.5 font-medium text-right">Liquidity</th>
                  <th className="px-4 py-2.5 font-medium text-right">Volume 24h</th>
                  <th className="px-4 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {pools.map((pool) => (
                  <tr key={pool.pairAddress} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 capitalize text-zinc-300 font-medium">{pool.dex}</td>
                    <td className="px-4 py-3 text-zinc-400">{symbol}/{pool.quoteSymbol}</td>
                    <td className="px-4 py-3 text-right text-zinc-300">{formatUsd(pool.liquidityUsd, true)}</td>
                    <td className="px-4 py-3 text-right text-zinc-300">{formatUsd(pool.volume24h, true)}</td>
                    <td className="px-4 py-3 text-right">
                      {pool.url && (
                        <a href={pool.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                          View →
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Token Info ── */}
      {(website || twitter || telegram || description) && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
          <p className="text-sm font-semibold text-white">Token Info</p>
          {description && (
            <p className="text-sm text-zinc-400 leading-relaxed max-w-3xl">{description}</p>
          )}
          <div className="flex flex-wrap gap-3">
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors">
                <Globe className="w-3.5 h-3.5 text-zinc-500" />Website
              </a>
            )}
            {twitter && (
              <a href={twitter} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />Twitter
              </a>
            )}
            {telegram && (
              <a href={telegram} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors">
                <Send className="w-3.5 h-3.5" />Telegram
              </a>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
