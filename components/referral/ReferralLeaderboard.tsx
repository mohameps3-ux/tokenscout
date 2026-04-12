"use client";

import { useEffect, useState } from "react";
import { Trophy, Users } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  username: string;
  points: number;
  referrals: number;
  code: string | null;
}

export function ReferralLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referral/leaderboard")
      .then((r) => r.json())
      .then((d) => setEntries(d.leaderboard ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-zinc-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <Users className="w-8 h-8 text-zinc-700 mx-auto" />
        <p className="text-zinc-500 text-sm">No referrals yet — be the first!</p>
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.rank}
          className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
            entry.rank <= 3 ? "border border-zinc-700/60 bg-zinc-800/40" : "hover:bg-zinc-800/20"
          }`}
        >
          <span className="w-7 text-center text-base shrink-0">
            {medals[entry.rank - 1] ?? (
              <span className="text-xs text-zinc-600 font-mono">#{entry.rank}</span>
            )}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{entry.username}</p>
            <p className="text-xs text-zinc-500">{entry.referrals} referral{entry.referrals !== 1 ? "s" : ""}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-blue-400">{entry.points.toLocaleString()}</p>
            <p className="text-xs text-zinc-600">pts</p>
          </div>
        </div>
      ))}
    </div>
  );
}
