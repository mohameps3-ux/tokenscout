"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, ExternalLink } from "lucide-react";

interface HotToken {
  url: string;
  chainId: string;
  tokenAddress: string;
  totalAmount: number;
  icon: string | null;
  description: string | null;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function chainLabel(id: string): string {
  const map: Record<string, string> = {
    ethereum: "ETH", solana: "SOL", bsc: "BSC", base: "BASE",
    polygon: "MATIC", arbitrum: "ARB", avalanche: "AVAX",
    optimism: "OP", fantom: "FTM",
  };
  return map[id.toLowerCase()] ?? id.toUpperCase().slice(0, 4);
}

function chainColor(id: string): string {
  const map: Record<string, string> = {
    ethereum: "bg-blue-500/20 text-blue-300",
    solana:   "bg-violet-500/20 text-violet-300",
    bsc:      "bg-yellow-500/20 text-yellow-300",
    base:     "bg-blue-600/20 text-blue-200",
    polygon:  "bg-purple-500/20 text-purple-300",
    arbitrum: "bg-sky-500/20 text-sky-300",
    avalanche:"bg-red-500/20 text-red-300",
    optimism: "bg-red-600/20 text-red-200",
    fantom:   "bg-cyan-500/20 text-cyan-300",
  };
  return map[id.toLowerCase()] ?? "bg-zinc-700 text-zinc-300";
}

export function DexTrendingSection() {
  const [tokens, setTokens] = useState<HotToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/market/dex-trending")
      .then((r) => r.json())
      .then((d) => setTokens(d.tokens ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && tokens.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-red-400" />
        <h2 className="text-sm font-semibold text-white">Hot on TokenScout</h2>
        <span className="text-xs text-zinc-600">boosted tokens · refreshes every 5m</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shrink-0 w-44 h-24 rounded-xl bg-zinc-800/50 animate-pulse" />
            ))
          : tokens.map((t, i) => (
              <Link
                key={`${t.chainId}-${t.tokenAddress}-${i}`}
                href={`/token/${t.chainId.toLowerCase()}/${t.tokenAddress}`}
                className="shrink-0 flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-600 hover:bg-zinc-800/60 px-3.5 py-3 transition-colors w-48 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {t.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.icon} alt="" className="w-7 h-7 rounded-full shrink-0 object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-zinc-700 shrink-0" />
                    )}
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${chainColor(t.chainId)}`}>
                      {chainLabel(t.chainId)}
                    </span>
                  </div>
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-zinc-600 group-hover:text-zinc-400 shrink-0 mt-0.5 transition-colors"
                    title="View on DexScreener"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {t.description && (
                  <p className="text-[11px] text-zinc-400 leading-snug mt-2 line-clamp-2">{t.description}</p>
                )}

                <div className="mt-2 flex items-center gap-1 text-[10px] text-orange-400">
                  <Flame className="w-2.5 h-2.5" />
                  <span className="font-semibold">{formatCompact(t.totalAmount)}</span>
                  <span className="text-zinc-600">boosted</span>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}
