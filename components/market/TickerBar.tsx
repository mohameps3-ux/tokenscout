"use client";

import { useEffect, useRef } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Coin {
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
}

interface TickerBarProps {
  coins: Coin[];
}

export function TickerBar({ coins }: TickerBarProps) {
  // Show only top 15 well-known coins in ticker
  const ticker = coins.slice(0, 15);
  // Duplicate for seamless loop
  const items = [...ticker, ...ticker];

  return (
    <div className="w-full overflow-hidden border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="ticker-track flex gap-0">
        {items.map((coin, i) => (
          <TickerItem key={`${coin.symbol}-${i}`} coin={coin} />
        ))}
      </div>
    </div>
  );
}

function TickerItem({ coin }: { coin: Coin }) {
  const up = (coin.price_change_percentage_24h ?? 0) >= 0;
  const pct = Math.abs(coin.price_change_percentage_24h ?? 0).toFixed(2);
  const price = coin.current_price >= 1
    ? coin.current_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : coin.current_price.toPrecision(4);

  return (
    <div className="flex items-center gap-2 px-5 py-2 border-r border-zinc-800/50 shrink-0 whitespace-nowrap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={coin.image} alt={coin.symbol} className="w-4 h-4 rounded-full" />
      <span className="text-xs font-semibold text-zinc-300 uppercase">{coin.symbol}</span>
      <span className="text-xs text-white font-mono">${price}</span>
      <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
        {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {pct}%
      </span>
    </div>
  );
}
