"use client";

import { useEffect, useState } from "react";
import { Fish, TrendingUp, Wallet, Activity, Bell, BellOff, ExternalLink } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { translations } from "@/lib/i18n";
import { formatUsd } from "@/lib/utils";
import { CHAIN_CONFIG, normalizeChain } from "@/lib/chains";

interface WhaleWallet {
  id: string;
  address: string;
  chain: string;
  totalTrades: number;
  buyCount: number;
  sellCount: number;
  totalVolume: number;
  winCount: number;
  bestTradeUsd: number;
  lastSeen: string;
}

interface FollowState {
  [key: string]: boolean; // key = `${address}_${chain}`
}

function winRate(wallet: WhaleWallet): number {
  if (wallet.totalTrades === 0) return 0;
  return Math.round((wallet.winCount / wallet.totalTrades) * 100);
}

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return "< 1h ago";
}

function shortenAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function WhalesPageClient() {
  const { lang } = useApp();
  const t = translations[lang].whales;
  const tc = translations[lang].common;

  const [wallets, setWallets] = useState<WhaleWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [follows, setFollows] = useState<FollowState>({});
  const [loadingFollow, setLoadingFollow] = useState<string | null>(null);

  // Mock userId for demo — in production this would come from auth context
  const userId = "demo-user";

  useEffect(() => {
    fetch("/api/whales")
      .then((r) => r.json())
      .then((data) => {
        setWallets(data.wallets ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleFollow = async (wallet: WhaleWallet) => {
    const key = `${wallet.address}_${wallet.chain}`;
    const isFollowing = follows[key];
    setLoadingFollow(key);

    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch("/api/whales/follow", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          walletAddress: wallet.address,
          chain: wallet.chain,
        }),
      });
      if (res.ok) {
        setFollows((prev) => ({ ...prev, [key]: !isFollowing }));
      }
    } catch {
      // silent fail
    } finally {
      setLoadingFollow(null);
    }
  };

  const getExplorerUrl = (wallet: WhaleWallet): string => {
    const cfg = CHAIN_CONFIG[normalizeChain(wallet.chain) ?? "BASE"];
    return cfg ? cfg.explorerUrl(wallet.address) : `#`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Fish className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
        </div>
        <p className="text-zinc-400">{t.subtitle}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-1">
          <p className="text-xs text-zinc-500">Tracked Wallets</p>
          <p className="text-2xl font-bold text-white">{wallets.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-1">
          <p className="text-xs text-zinc-500">Total Volume</p>
          <p className="text-2xl font-bold text-white">
            {formatUsd(wallets.reduce((s, w) => s + w.totalVolume, 0), true)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-1">
          <p className="text-xs text-zinc-500">Total Trades</p>
          <p className="text-2xl font-bold text-white">
            {wallets.reduce((s, w) => s + w.totalTrades, 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-1">
          <p className="text-xs text-zinc-500">Avg Win Rate</p>
          <p className="text-2xl font-bold text-emerald-400">
            {wallets.length > 0
              ? `${Math.round(wallets.reduce((s, w) => s + winRate(w), 0) / wallets.length)}%`
              : "—"}
          </p>
        </div>
      </div>

      {/* Follow note */}
      <div className="flex items-start gap-2 text-xs text-zinc-500 bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3">
        <Bell className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
        <span>{t.followNote}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">{t.topWallets}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{t.tableDesc}</p>
          </div>
          <Activity className="w-4 h-4 text-zinc-600" />
        </div>

        {loading ? (
          <div className="divide-y divide-zinc-800/40">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-4 flex items-center gap-4">
                <div className="w-8 h-8 bg-zinc-800 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 bg-zinc-800 rounded animate-pulse" />
                  <div className="h-2.5 w-24 bg-zinc-800/60 rounded animate-pulse" />
                </div>
                <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : wallets.length === 0 ? (
          <div className="px-4 py-16 text-center space-y-2">
            <Fish className="w-10 h-10 text-zinc-700 mx-auto" />
            <p className="text-sm text-zinc-400">{t.noWhales}</p>
            <p className="text-xs text-zinc-600">{t.noWhalesHint}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800/60">
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">{t.wallet}</th>
                  <th className="px-4 py-2.5 font-medium">{t.chain}</th>
                  <th className="px-4 py-2.5 font-medium text-right">{t.volume}</th>
                  <th className="px-4 py-2.5 font-medium text-right">{t.trades}</th>
                  <th className="px-4 py-2.5 font-medium text-right">{t.winRate}</th>
                  <th className="px-4 py-2.5 font-medium text-right">{t.bestTrade}</th>
                  <th className="px-4 py-2.5 font-medium text-right">{t.lastSeen}</th>
                  <th className="px-4 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {wallets.map((wallet, idx) => {
                  const key = `${wallet.address}_${wallet.chain}`;
                  const isFollowing = follows[key] ?? false;
                  const wr = winRate(wallet);
                  const explorerUrl = getExplorerUrl(wallet);

                  return (
                    <tr key={wallet.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-zinc-600 tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
                            <Wallet className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm text-zinc-200 font-mono">
                                {shortenAddress(wallet.address)}
                              </span>
                              <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-600 hover:text-zinc-400 transition-colors"
                                title="View on explorer"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <div className="flex gap-2 text-xs text-zinc-600 mt-0.5">
                              <span>{wallet.buyCount}B / {wallet.sellCount}S</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          wallet.chain === "SOLANA"
                            ? "text-purple-300 bg-purple-500/10"
                            : "text-blue-300 bg-blue-500/10"
                        }`}>
                          {wallet.chain === "SOLANA" ? "Solana" : wallet.chain}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">
                        {formatUsd(wallet.totalVolume, true)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400 tabular-nums">
                        {wallet.totalTrades}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold tabular-nums ${
                          wr >= 60 ? "text-emerald-400" :
                          wr >= 40 ? "text-yellow-400" : "text-red-400"
                        }`}>
                          {wr}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {wallet.bestTradeUsd > 0 ? (
                          <span className="text-emerald-400 font-medium tabular-nums">
                            +{formatUsd(wallet.bestTradeUsd, true)}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-500 text-xs">
                        {timeSince(wallet.lastSeen)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleFollow(wallet)}
                          disabled={loadingFollow === key}
                          title={t.followTooltip}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isFollowing
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30"
                          } disabled:opacity-50`}
                        >
                          {isFollowing
                            ? <><BellOff className="w-3 h-3" />{tc.unfollow}</>
                            : <><Bell className="w-3 h-3" />{tc.follow}</>
                          }
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <p className="text-sm font-semibold text-white">How Whale Tracking Works</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 text-xs text-zinc-500">
          <div className="space-y-1">
            <p className="text-zinc-300 font-medium">Data Collection</p>
            <p>Wallets are identified from GeckoTerminal trade data during token scans. Each trade is recorded and attributed.</p>
          </div>
          <div className="space-y-1">
            <p className="text-zinc-300 font-medium">Win Rate</p>
            <p>A trade is counted as a "win" when the token price increased after the buy. Calculated from all tracked buys.</p>
          </div>
          <div className="space-y-1">
            <p className="text-zinc-300 font-medium">Follow Alerts</p>
            <p>When a followed wallet appears in new scan data buying a token, you receive a Telegram notification instantly.</p>
          </div>
        </div>
        <p className="text-[10px] text-zinc-700">
          Whale data is heuristic-based and should not be used as financial advice. Win rates are estimates based on price movement, not actual P&L.
        </p>
      </div>
    </div>
  );
}
