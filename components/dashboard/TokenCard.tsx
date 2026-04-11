"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/dashboard/ScoreBar";
import { formatUsd, formatPercent, formatAge, truncateAddress } from "@/lib/utils";
import { getScoreLabel } from "@/lib/scoring/scorer";
import { ExternalLink, AlertTriangle } from "lucide-react";

interface TokenCardProps {
  token: {
    id: string;
    address: string;
    chain: string;
    name: string;
    symbol: string;
    priceUsd: number | null;
    liquidity: number | null;
    marketCap: number | null;
    volume24h: number | null;
    priceChange24h: number | null;
    totalScore: number;
    liquidityScore: number;
    holderScore: number;
    ageScore: number;
    volumeScore: number;
    suspicionScore: number;
    isHoneypot: boolean;
    hasBundledBuys: boolean;
    listedAt: string | null;
    pairAddress: string | null;
    dexId: string | null;
  };
}

export function TokenCard({ token }: TokenCardProps) {
  const { bg } = getScoreLabel(token.totalScore);
  const priceUp = (token.priceChange24h ?? 0) >= 0;
  const dexUrl = getDexUrl(token);
  const detailUrl = `/token/${token.chain.toLowerCase()}/${token.address}`;

  return (
    <div
      className={`rounded-xl border bg-zinc-900/70 backdrop-blur-sm p-4 transition-all hover:border-zinc-600 hover:shadow-lg hover:shadow-black/20 flex flex-col gap-3 ${bg}`}
    >
      {/* Header — clickable to detail page */}
      <Link href={detailUrl} className="block">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm hover:text-blue-400 transition-colors">
                {token.symbol}
              </span>
              <Badge variant={token.chain === "BASE" ? "default" : "success"}>
                {token.chain}
              </Badge>
              {token.isHoneypot && (
                <Badge variant="danger">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Honeypot
                </Badge>
              )}
              {token.hasBundledBuys && (
                <Badge variant="warning">Bundled</Badge>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 truncate">{token.name}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="text-right">
              <p className="text-xs text-zinc-500">Score</p>
              <p className="text-sm font-bold">
                <span className={getScoreLabel(token.totalScore).color}>{token.totalScore}</span>
                <span className="text-zinc-600">/100</span>
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* Score bar */}
      <ScoreBar score={token.totalScore} size="sm" showLabel={false} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <Stat label="Price" value={formatUsd(token.priceUsd)} />
        <Stat
          label="24h"
          value={formatPercent(token.priceChange24h)}
          className={priceUp ? "text-emerald-400" : "text-red-400"}
        />
        <Stat label="Liquidity" value={formatUsd(token.liquidity, true)} />
        <Stat label="Volume 24h" value={formatUsd(token.volume24h, true)} />
        <Stat label="MCap" value={formatUsd(token.marketCap, true)} />
        <Stat
          label="Age"
          value={formatAge(token.listedAt ? new Date(token.listedAt) : null)}
        />
      </div>

      {/* Address + links */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
        <Link
          href={detailUrl}
          className="text-xs text-zinc-600 font-mono hover:text-zinc-400 transition-colors"
        >
          {truncateAddress(token.address)}
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={detailUrl}
            className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
          >
            Details
          </Link>
          {dexUrl && (
            <a
              href={dexUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Trade <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <p className="text-zinc-600">{label}</p>
      <p className={`text-zinc-200 font-medium ${className ?? ""}`}>{value}</p>
    </div>
  );
}

function getDexUrl(token: {
  chain: string;
  address: string;
  pairAddress: string | null;
  dexId: string | null;
}): string | null {
  if (token.chain === "SOLANA") {
    return `https://jup.ag/swap/SOL-${token.address}`;
  }
  if (token.chain === "BASE") {
    if (token.pairAddress) {
      return `https://app.uniswap.org/explore/pools/base/${token.pairAddress}`;
    }
    return `https://app.uniswap.org/swap?outputCurrency=${token.address}&chain=base`;
  }
  return null;
      }
