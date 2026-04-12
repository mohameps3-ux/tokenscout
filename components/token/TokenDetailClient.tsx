"use client";

import { useRouter, usePathname } from "next/navigation";
import { PriceChart } from "@/components/token/PriceChart";
import { CopyAddress } from "@/components/token/CopyAddress";
import { AntiRug2Card } from "@/components/token/AntiRug2Card";
import { ScoreBar, ScoreBreakdown } from "@/components/dashboard/ScoreBar";
import { Badge } from "@/components/ui/badge";
import { formatUsd, formatPercent, formatAge, formatNumber } from "@/lib/utils";
import { getScoreLabel, type RiskLevel } from "@/lib/scoring/scorer";
import { CHAIN_CONFIG, normalizeChain } from "@/lib/chains";
import {
  TrendingUp, TrendingDown, Globe, Send, ExternalLink,
  AlertTriangle, Shield, Zap, ShieldX,
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
  contractSafety: number;
  liquiditySafety: number;
  teamSafety: number;
  riskLevel: RiskLevel;
  insiderBuyCount: number;
  flags: string[];
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
  priceChange: { h1: number; h6: number; h24: number; d7?: number } | null;
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
  high24h: number | null;
  low24h: number | null;
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
  { label: "1W", value: "1w" },
];


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
    pairCreatedAt, listedAt, ohlcv, high24h, low24h, score, imageUrl,
  } = data;

  const change24h = priceChange?.h24 ?? null;
  const priceUp   = (change24h ?? 0) >= 0;
  const scoreLabel = score ? getScoreLabel(score.total) : null;
  const chainCfg   = CHAIN_CONFIG[normalizeChain(chain) ?? "BASE"];
  const explorer   = { name: chainCfg.explorerName, url: chainCfg.explorerUrl };
  const trades     = chainCfg.tradeLinks(address, pairAddress);
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
            {score?.riskLevel === "DANGER" && (
              <Badge variant="danger"><ShieldX className="w-3 h-3 mr-1" />DANGER</Badge>
            )}
            {score?.isHoneypot && <Badge variant="danger"><AlertTriangle className="w-3 h-3 mr-1" />Honeypot</Badge>}
            {score?.hasBundledBuys && <Badge variant="warning">Bundled Buys</Badge>}
            {(score?.insiderBuyCount ?? 0) > 0 && !score?.hasBundledBuys && (
              <Badge variant="warning">Coordinated Buy</Badge>
            )}
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
              {TIMEFRAMES.map(({ label, value }) => {
                const pct =
                  value === "1h" ? priceChange?.h1 :
                  value === "4h" ? priceChange?.h6 :
                  value === "1d" ? priceChange?.h24 :
                  priceChange?.d7;
                const pctColor = pct == null ? "" : pct >= 0 ? "text-emerald-400" : "text-red-400";
                return (
                  <button key={value} onClick={() => setTimeframe(value)}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                      currentTimeframe === value
                        ? "bg-blue-600 text-white"
                        : "text-zinc-400 bg-zinc-800 hover:bg-zinc-700 hover:text-white"
                    }`}>
                    <span>{label}</span>
                    {pct != null && (
                      <span className={`ml-1 ${currentTimeframe === value ? "text-white/80" : pctColor}`}>
                        {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {ohlcv && ohlcv.length > 0 ? (
            <PriceChart ohlcv={ohlcv} />
          ) : (
            <div className="h-72 flex items-center justify-center text-zinc-600 text-sm">
              No chart data available
            </div>
          )}

          {/* Below-chart stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-zinc-800/60">
            {/* 24h High/Low */}
            <div>
              <p className="text-xs text-zinc-500 mb-1">24h High</p>
              <p className="text-sm font-semibold text-emerald-400 font-mono">
                {high24h != null ? formatUsd(high24h) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">24h Low</p>
              <p className="text-sm font-semibold text-red-400 font-mono">
                {low24h != null ? formatUsd(low24h) : "—"}
              </p>
            </div>

            {/* Price changes */}
            <div>
              <p className="text-xs text-zinc-500 mb-1">Price Change</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {[
                  { label: "1h", val: priceChange?.h1 },
                  { label: "6h", val: priceChange?.h6 },
                  { label: "24h", val: priceChange?.h24 },
                  { label: "7d",  val: priceChange?.d7 },
                ].map(({ label, val }) =>
                  val != null ? (
                    <span key={label} className="text-xs">
                      <span className="text-zinc-600">{label} </span>
                      <span className={val >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {val >= 0 ? "+" : ""}{val.toFixed(2)}%
                      </span>
                    </span>
                  ) : null
                )}
              </div>
            </div>

            {/* Buy/Sell pressure */}
            {txns24h && txns24h.buys + txns24h.sells > 0 && (() => {
              const total = txns24h.buys + txns24h.sells;
              const buyPct = Math.round((txns24h.buys / total) * 100);
              const sellPct = 100 - buyPct;
              return (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Buy / Sell Pressure</p>
                  <div className="flex h-2 rounded-full overflow-hidden bg-zinc-800 mb-1">
                    <div className="bg-emerald-500 transition-all" style={{ width: `${buyPct}%` }} />
                    <div className="bg-red-500 transition-all" style={{ width: `${sellPct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-400">{buyPct}% buy</span>
                    <span className="text-red-400">{sellPct}% sell</span>
                  </div>
                </div>
              );
            })()}
          </div>
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
              {!score.isHoneypot && score.suspicion >= 8 && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                  <Shield className="w-3.5 h-3.5 shrink-0" />No suspicious patterns detected
                </div>
              )}
            </div>
          )}

          {/* Anti-Rug 2.0 */}
          {score && (
            <AntiRug2Card
              contractSafety={score.contractSafety}
              liquiditySafety={score.liquiditySafety}
              teamSafety={score.teamSafety}
              riskLevel={score.riskLevel}
              insiderBuyCount={score.insiderBuyCount}
              isHoneypot={score.isHoneypot}
              hasBundledBuys={score.hasBundledBuys}
              flags={score.flags ?? []}
            />
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
