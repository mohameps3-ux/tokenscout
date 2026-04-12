"use client";

import { TrendingUp, Flame } from "lucide-react";

interface TrendingCoin {
  item: {
    id: string;
    name: string;
    symbol: string;
    thumb: string;
    market_cap_rank: number | null;
    data?: {
      price: string;
      price_change_percentage_24h?: { usd: number };
    };
  };
}

interface TrendingSectionProps {
  trending: TrendingCoin[];
}

export function TrendingSection({ trending }: TrendingSectionProps) {
  if (!trending.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-400" />
        <h2 className="text-sm font-semibold text-white">Trending</h2>
        <span className="text-xs text-zinc-600">on CoinGecko right now</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {trending.map((t, i) => {
          const coin = t.item;
          const change = coin.data?.price_change_percentage_24h?.usd;
          const up = (change ?? 0) >= 0;
          return (
            <div key={coin.id} className="flex items-center gap-2.5 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 hover:border-zinc-700 transition-colors">
              <span className="text-xs text-zinc-600 font-mono w-3">#{i + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coin.thumb} alt={coin.symbol} className="w-6 h-6 rounded-full" />
              <div>
                <p className="text-xs font-semibold text-white">{coin.symbol.toUpperCase()}</p>
                <p className="text-[10px] text-zinc-500">{coin.name}</p>
              </div>
              {change != null && (
                <span className={`text-xs font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
                  {up ? "+" : ""}{change.toFixed(2)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
