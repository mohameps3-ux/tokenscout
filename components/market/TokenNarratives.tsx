"use client";

import { useEffect, useState } from "react";
import { Layers, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";

interface NarrativeCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change24h: number | null;
  change7d: number | null;
  marketCap: number;
}

interface Narrative {
  id: string;
  label: string;
  emoji: string;
  color: string;
  description: string;
  coins: NarrativeCoin[];
}

function formatPrice(p: number): string {
  if (p >= 1000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  return `$${p.toPrecision(3)}`;
}

function formatMcap(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function PctChange({ value }: { value: number | null }) {
  if (value == null) return <span className="text-zinc-600">—</span>;
  const up = value >= 0;
  return (
    <span className={`text-xs font-medium inline-flex items-center gap-0.5 ${up ? "text-emerald-400" : "text-red-400"}`}>
      {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function TokenNarratives() {
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/market/narratives")
      .then((r) => r.json())
      .then((d) => setNarratives(d.narratives ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && narratives.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-white">Token Narratives</h2>
        <span className="text-xs text-zinc-600">top tokens by sector · 24h change</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 h-52 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {narratives.map((narrative) => (
            <NarrativeCard key={narrative.id} narrative={narrative} />
          ))}
        </div>
      )}
    </div>
  );
}

function NarrativeCard({ narrative }: { narrative: Narrative }) {
  const avgChange24h = narrative.coins.length > 0
    ? narrative.coins.reduce((sum, c) => sum + (c.change24h ?? 0), 0) / narrative.coins.length
    : null;
  const overallUp = (avgChange24h ?? 0) >= 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3 hover:border-zinc-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{narrative.emoji}</span>
            <span className="text-sm font-semibold text-white">{narrative.label}</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">{narrative.description}</p>
        </div>
        {avgChange24h != null && (
          <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${overallUp ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
            {overallUp ? "+" : ""}{avgChange24h.toFixed(1)}% avg
          </div>
        )}
      </div>

      {/* Coin list */}
      {narrative.coins.length === 0 ? (
        <p className="text-xs text-zinc-600">No data available</p>
      ) : (
        <div className="space-y-2">
          {narrative.coins.slice(0, 5).map((coin) => (
            <a
              key={coin.id}
              href={`https://www.coingecko.com/en/coins/${coin.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between hover:bg-zinc-800/40 -mx-1 px-1 py-0.5 rounded-md transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coin.image} alt={coin.symbol} className="w-5 h-5 rounded-full shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">{coin.symbol}</span>
                  <span className="text-[10px] text-zinc-600 ml-1">{formatMcap(coin.marketCap)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-zinc-300 font-mono">{formatPrice(coin.price)}</span>
                <PctChange value={coin.change24h} />
                <ExternalLink className="w-2.5 h-2.5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
