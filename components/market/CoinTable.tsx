"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TrendingUp, TrendingDown, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { formatUsd } from "@/lib/utils";

export interface CoinRow {
  id: string;
  market_cap_rank: number;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_1h_in_currency: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency: number | null;
  market_cap: number;
  total_volume: number;
  circulating_supply: number;
}

type SortKey = "rank" | "price" | "change1h" | "change24h" | "change7d" | "mcap" | "volume";
type SortDir = "asc" | "desc";

interface CoinTableProps {
  initialCoins: CoinRow[];
}

function PctCell({ value }: { value: number | null }) {
  if (value == null) return <td className="px-3 py-3 text-right text-zinc-600 text-sm">—</td>;
  const up = value >= 0;
  return (
    <td className={`px-3 py-3 text-right text-sm font-medium tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}>
      <span className="inline-flex items-center gap-0.5 justify-end">
        {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(value).toFixed(2)}%
      </span>
    </td>
  );
}

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="w-3 h-3 opacity-30" />;
  return dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
}

export function CoinTable({ initialCoins }: CoinTableProps) {
  const [coins, setCoins] = useState<CoinRow[]>(initialCoins);
  const [flashing, setFlashing] = useState<Record<string, "up" | "down">>({});
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const prevPrices = useRef<Record<string, number>>({});
  const PAGE_SIZE = 25;

  const applyFlash = useCallback((updated: CoinRow[]) => {
    const next: Record<string, "up" | "down"> = {};
    for (const c of updated) {
      const prev = prevPrices.current[c.id];
      if (prev != null && prev !== c.current_price) {
        next[c.id] = c.current_price > prev ? "up" : "down";
      }
    }
    if (Object.keys(next).length > 0) {
      setFlashing(next);
      setTimeout(() => setFlashing({}), 1200);
    }
    const prices: Record<string, number> = {};
    for (const c of updated) prices[c.id] = c.current_price;
    prevPrices.current = prices;
  }, []);

  // Seed initial prices
  useEffect(() => {
    const prices: Record<string, number> = {};
    for (const c of initialCoins) prices[c.id] = c.current_price;
    prevPrices.current = prices;
  }, [initialCoins]);

  // Poll every 30 seconds
  useEffect(() => {
    const tick = async () => {
      try {
        const res = await fetch("/api/market");
        if (!res.ok) return;
        const data = await res.json();
        if (data.coins?.length) {
          applyFlash(data.coins);
          setCoins(data.coins);
        }
      } catch {}
    };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [applyFlash]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "rank" ? "asc" : "desc");
    }
    setPage(1);
  };

  const sorted = [...coins].sort((a, b) => {
    let va = 0, vb = 0;
    switch (sortKey) {
      case "rank":     va = a.market_cap_rank; vb = b.market_cap_rank; break;
      case "price":    va = a.current_price;   vb = b.current_price;   break;
      case "change1h": va = a.price_change_percentage_1h_in_currency ?? -999; vb = b.price_change_percentage_1h_in_currency ?? -999; break;
      case "change24h":va = a.price_change_percentage_24h ?? -999; vb = b.price_change_percentage_24h ?? -999; break;
      case "change7d": va = a.price_change_percentage_7d_in_currency ?? -999; vb = b.price_change_percentage_7d_in_currency ?? -999; break;
      case "mcap":     va = a.market_cap;    vb = b.market_cap;    break;
      case "volume":   va = a.total_volume;  vb = b.total_volume;  break;
    }
    return sortDir === "asc" ? va - vb : vb - va;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const Th = ({ label, col, right }: { label: string; col: SortKey; right?: boolean }) => (
    <th
      className={`px-3 py-3 text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors select-none ${right ? "text-right" : "text-left"}`}
      onClick={() => toggleSort(col)}
    >
      <span className={`inline-flex items-center gap-1 ${right ? "flex-row-reverse" : ""}`}>
        {label}<SortIcon col={col} sortKey={sortKey} dir={sortDir} />
      </span>
    </th>
  );

  // Smart pagination: show at most 7 page buttons with ellipsis
  const pageButtons = (): (number | "…")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (page > 3) pages.push("…");
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
      pages.push(p);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Top {sorted.length} Cryptocurrencies by Market Cap</h2>
        <span className="text-xs text-zinc-600">Updates every 60s</span>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="border-b border-zinc-800 bg-zinc-900/60">
              <tr>
                <Th label="#" col="rank" />
                <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Name</th>
                <Th label="Price" col="price" right />
                <Th label="1h %" col="change1h" right />
                <Th label="24h %" col="change24h" right />
                <Th label="7d %" col="change7d" right />
                <Th label="Market Cap" col="mcap" right />
                <Th label="Volume (24h)" col="volume" right />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {visible.map((coin) => {
                const flash = flashing[coin.id];
                const price = coin.current_price >= 1
                  ? coin.current_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : coin.current_price < 0.01
                    ? coin.current_price.toPrecision(4)
                    : coin.current_price.toFixed(4);

                return (
                  <tr key={coin.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-3 py-3 text-sm text-zinc-500 tabular-nums w-10">
                      {coin.market_cap_rank}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-white leading-none">{coin.name}</p>
                          <p className="text-xs text-zinc-500 uppercase mt-0.5">{coin.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-3 py-3 text-right text-sm font-mono font-medium transition-colors duration-700 ${
                      flash === "up" ? "text-emerald-300 price-flash-up" : flash === "down" ? "text-red-300 price-flash-down" : "text-white"
                    }`}>
                      ${price}
                    </td>
                    <PctCell value={coin.price_change_percentage_1h_in_currency} />
                    <PctCell value={coin.price_change_percentage_24h} />
                    <PctCell value={coin.price_change_percentage_7d_in_currency} />
                    <td className="px-3 py-3 text-right text-sm text-zinc-300 tabular-nums">
                      {formatUsd(coin.market_cap, true)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-zinc-400 tabular-nums">
                      {formatUsd(coin.total_volume, true)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}</span>
        <div className="flex gap-1 items-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 h-7 rounded text-xs bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ‹
          </button>
          {pageButtons().map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="w-7 text-center text-zinc-600">…</span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded text-xs transition-colors ${
                  p === page ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2 h-7 rounded text-xs bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
