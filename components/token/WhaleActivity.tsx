"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { formatUsd, truncateAddress } from "@/lib/utils";
import { CHAIN_CONFIG, normalizeChain } from "@/lib/chains";

interface Trade {
  txHash: string;
  type: "buy" | "sell";
  priceUsd: number;
  amountUsd: number;
  walletAddress: string;
  timestamp: string;
}

interface WhaleActivityProps {
  chain: string;
  address: string;
  pairAddress: string | null;
}

function formatTimeAgo(ts: string): string {
  if (!ts) return "—";
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function WhaleActivity({ chain, address, pairAddress }: WhaleActivityProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const normalized = normalizeChain(chain) ?? "BASE";
  const cfg = CHAIN_CONFIG[normalized];

  useEffect(() => {
    if (!pairAddress) {
      setLoading(false);
      return;
    }

    fetch(`/api/token/${chain.toLowerCase()}/${address}/trades?pair=${encodeURIComponent(pairAddress)}`)
      .then((r) => r.json())
      .then((data) => {
        setTrades(data.trades ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [chain, address, pairAddress]);

  // Top 10 by USD amount
  const topTrades = [...trades]
    .sort((a, b) => b.amountUsd - a.amountUsd)
    .slice(0, 10);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Whale Activity</p>
          <p className="text-xs text-zinc-500 mt-0.5">Top recent trades by volume</p>
        </div>
        {!loading && !error && trades.length > 0 && (
          <span className="text-xs text-zinc-600">{trades.length} recent txns</span>
        )}
      </div>

      {loading && (
        <div className="p-8 flex justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-blue-400 animate-spin" />
        </div>
      )}

      {!loading && !pairAddress && (
        <div className="p-6 text-center text-zinc-600 text-sm">
          No pool address available for whale tracking.
        </div>
      )}

      {!loading && error && pairAddress && (
        <div className="p-6 text-center text-zinc-600 text-sm">
          Could not load recent trades.
        </div>
      )}

      {!loading && !error && pairAddress && topTrades.length === 0 && (
        <div className="p-6 text-center text-zinc-600 text-sm">No recent trades found.</div>
      )}

      {!loading && !error && topTrades.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-zinc-500 border-b border-zinc-800/60">
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Amount (USD)</th>
                <th className="px-4 py-2.5 font-medium">Wallet</th>
                <th className="px-4 py-2.5 font-medium">Time</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {topTrades.map((t, i) => (
                <tr key={`${t.txHash}-${i}`} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <span
                      className={`flex items-center gap-1 font-medium ${
                        t.type === "buy" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {t.type === "buy" ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {t.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-200 font-medium">
                    {formatUsd(t.amountUsd, true)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-zinc-400">
                    {truncateAddress(t.walletAddress)}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500">{formatTimeAgo(t.timestamp)}</td>
                  <td className="px-4 py-2.5 text-right">
                    {t.walletAddress && (
                      <a
                        href={cfg.explorerUrl(t.walletAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-600 hover:text-zinc-400 transition-colors inline-flex"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
