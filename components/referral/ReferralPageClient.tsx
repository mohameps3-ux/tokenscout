"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Copy, CheckCircle, Trophy, Gift, Star } from "lucide-react";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  points: number;
  referralCount: number;
  proExpiresAt: string | null;
  nextReward: { threshold: number; reward: string; needed: number } | null;
}

interface LeaderEntry {
  rank: number;
  username: string;
  points: number;
  referrals: number;
  code: string | null;
}

export function ReferralPageClient() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [noSession, setNoSession] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/referral").then((r) => r.json()),
      fetch("/api/referral/leaderboard").then((r) => r.json()),
    ])
      .then(([ref, lb]) => {
        if (ref.error) setNoSession(true);
        else setData(ref);
        setLeaderboard(lb.leaderboard ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function copyLink() {
    if (!data) return;
    navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Hero */}
        <div className="text-center py-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Referral <span className="text-blue-400">Program</span>
          </h1>
          <p className="mt-2 text-zinc-400 text-sm max-w-md mx-auto">
            Invite friends to TokenScout. Earn points. Unlock Pro access — for free.
          </p>
        </div>

        {/* Reward tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex gap-4 items-start">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0">
              <Gift className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">500 Points → 1 Week Pro</p>
              <p className="text-xs text-zinc-400 mt-1">
                Refer 5 friends and unlock a full week of Pro features automatically.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex gap-4 items-start">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/10 border border-yellow-500/20 shrink-0">
              <Star className="w-4.5 h-4.5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">2,000 Points → 1 Month Pro</p>
              <p className="text-xs text-zinc-400 mt-1">
                Refer 20 friends and earn a full month of Pro access — free.
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-zinc-700 border-t-blue-400 animate-spin" />
          </div>
        )}

        {!loading && noSession && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-10 text-center">
            <p className="text-zinc-300 font-medium">Sign in to access your referral dashboard</p>
            <p className="text-zinc-500 text-sm mt-1">Connect your wallet from the scanner page to get started.</p>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
                <p className="text-2xl font-bold text-white">{data.points}</p>
                <p className="text-xs text-zinc-500 mt-1">Points</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
                <p className="text-2xl font-bold text-white">{data.referralCount}</p>
                <p className="text-xs text-zinc-500 mt-1">Referrals Made</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-400">+100</p>
                <p className="text-xs text-zinc-500 mt-1">Pts per referral</p>
              </div>
            </div>

            {/* Progress to next reward */}
            {data.nextReward && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-300">
                    Next reward:{" "}
                    <span className="text-white font-semibold">{data.nextReward.reward}</span>
                  </p>
                  <p className="text-xs text-zinc-500">{data.nextReward.needed} pts to go</p>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{
                      width: `${Math.min(100, (data.points / data.nextReward.threshold) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-zinc-600">
                  {data.points} / {data.nextReward.threshold} points
                </p>
              </div>
            )}

            {/* Referral link */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
              <p className="text-sm font-semibold text-white">Your Referral Link</p>
              <div className="flex gap-2">
                <code className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-300 font-mono truncate">
                  {data.referralLink}
                </code>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shrink-0"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-zinc-600">
                Each friend who joins using your link earns you 100 points. Rewards are applied automatically.
              </p>
            </div>

            {/* Active Pro badge */}
            {data.proExpiresAt && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                <p className="text-sm text-emerald-400 font-medium">
                  Pro active until {new Date(data.proExpiresAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <p className="text-sm font-semibold text-white">Top Referrers</p>
            </div>
            <div className="divide-y divide-zinc-800/40">
              {leaderboard.slice(0, 10).map((entry) => (
                <div key={entry.rank} className="px-4 py-3 flex items-center gap-3">
                  <span
                    className={`text-sm font-bold w-6 text-center shrink-0 ${
                      entry.rank === 1
                        ? "text-yellow-400"
                        : entry.rank === 2
                        ? "text-zinc-300"
                        : entry.rank === 3
                        ? "text-amber-600"
                        : "text-zinc-600"
                    }`}
                  >
                    #{entry.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 font-medium truncate">{entry.username}</p>
                    <p className="text-xs text-zinc-500">
                      {entry.referrals} referral{entry.referrals !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-blue-400">{entry.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
