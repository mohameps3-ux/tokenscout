"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Gift, Users, Trophy, Zap, Clock } from "lucide-react";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  points: number;
  referralCount: number;
  proExpiresAt: string | null;
  nextReward: { threshold: number; reward: string; needed: number } | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); }
    catch { /* fallback */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-colors shrink-0"
    >
      {copied ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
              : <><Copy className="w-3 h-3" />Copy</>}
    </button>
  );
}

export function ReferralCard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-zinc-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || (data as { error?: string }).error) {
    return (
      <p className="text-sm text-zinc-500 text-center py-8">
        Sign in to get your referral link.
      </p>
    );
  }

  const isProActive = data.proExpiresAt && new Date(data.proExpiresAt) > new Date();
  const progressPct = data.nextReward
    ? Math.min(100, ((data.nextReward.threshold - data.nextReward.needed) / data.nextReward.threshold) * 100)
    : 100;

  return (
    <div className="space-y-5">
      {/* Points banner */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600/20 to-violet-600/20 border border-blue-500/20 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/30">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{data.points.toLocaleString()} pts</p>
            <p className="text-xs text-zinc-400">{data.referralCount} referral{data.referralCount !== 1 ? "s" : ""} made</p>
          </div>
        </div>
        {isProActive && (
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
              <Clock className="w-3 h-3" />PRO Active
            </span>
            <p className="text-xs text-zinc-500 mt-1">
              Expires {new Date(data.proExpiresAt!).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Progress to next reward */}
      {data.nextReward && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Next reward: <span className="text-white font-medium">{data.nextReward.reward}</span>
            </span>
            <span className="text-zinc-500 text-xs">{data.nextReward.needed} pts needed</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-zinc-600">
            {data.points} / {data.nextReward.threshold} points — each referral earns 100 pts
          </p>
        </div>
      )}

      {/* Reward tiers */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { pts: 500,  reward: "1 week Pro",  icon: "🏅", unlocked: data.points >= 500  },
          { pts: 2000, reward: "1 month Pro", icon: "🏆", unlocked: data.points >= 2000 },
        ].map(({ pts, reward, icon, unlocked }) => (
          <div
            key={pts}
            className={`rounded-xl border p-3 text-center transition-colors ${
              unlocked
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-zinc-800 bg-zinc-900/50"
            }`}
          >
            <span className="text-2xl">{icon}</span>
            <p className={`text-sm font-semibold mt-1 ${unlocked ? "text-emerald-400" : "text-white"}`}>
              {reward}
            </p>
            <p className="text-xs text-zinc-500">{pts.toLocaleString()} points</p>
            {unlocked && <p className="text-xs text-emerald-500 mt-1 font-medium">Unlocked ✓</p>}
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide flex items-center gap-2">
          <Users className="w-3.5 h-3.5" />Your Referral Link
        </p>
        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
          <span className="text-xs text-zinc-300 font-mono flex-1 truncate">{data.referralLink}</span>
          <CopyButton text={data.referralLink} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Code:</span>
          <code className="text-sm font-bold text-blue-400 font-mono tracking-widest">{data.referralCode}</code>
          <CopyButton text={data.referralCode} />
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide flex items-center gap-2">
          <Gift className="w-3.5 h-3.5" />How it Works
        </p>
        <div className="space-y-2">
          {[
            "Share your referral link with friends",
            "When they join TokenScout, you earn 100 points",
            "500 points unlocks 1 week of Pro access",
            "2,000 points unlocks 1 month of Pro access",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/20 border border-blue-600/30 text-xs text-blue-400 font-bold mt-0.5">
                {i + 1}
              </span>
              <span className="text-zinc-400">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
