"use client";

import { useEffect, useState } from "react";
import { getEloTier } from "@/lib/elo";
import { cn } from "@/lib/utils";
import { Trophy, Bot } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardUser {
  rank: number;
  userId: string;
  username: string | null;
  eloScore: number;
  predictions: number;
  accuracy: number;
  badges: string[];
  isAlphaCaller: boolean;
}

interface LeaderboardData {
  weekStart: string;
  weekly: LeaderboardUser[];
  allTime: (LeaderboardUser & { totalPredictions: number; correctPredictions: number })[];
}

export function Leaderboard({ currentUserId }: { currentUserId?: string }) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [tab, setTab] = useState<"weekly" | "alltime">("weekly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const entries = tab === "weekly" ? data?.weekly : data?.allTime;

  return (
    <div className="space-y-4">
      {/* Tab toggle */}
      <div className="flex rounded-lg border border-zinc-800 p-0.5 bg-zinc-900 w-fit">
        {(["weekly", "alltime"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-md text-xs font-medium transition-colors",
              tab === t
                ? "bg-zinc-700 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {t === "weekly" ? "This Week" : "All Time"}
          </button>
        ))}
      </div>

      {tab === "weekly" && data && (
        <p className="text-[10px] text-zinc-600">
          Week of {new Date(data.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          {" "}· Top 10 earn{" "}
          <span className="text-violet-400">Alpha Caller</span> badge
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !entries || entries.length === 0 ? (
        <div className="text-center py-10 text-zinc-600 text-sm">
          No predictions yet this week.
          <br />
          <span className="text-xs">Be the first to predict!</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry) => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={entry.userId === currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardUser;
  isCurrentUser: boolean;
}) {
  const { tier, color, icon } = getEloTier(entry.eloScore);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors",
        isCurrentUser
          ? "border-blue-500/40 bg-blue-500/5"
          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
      )}
    >
      {/* Rank */}
      <span className={cn(
        "text-sm font-bold w-6 text-center tabular-nums",
        entry.rank === 1 ? "text-yellow-400" :
        entry.rank === 2 ? "text-zinc-300" :
        entry.rank === 3 ? "text-amber-600" : "text-zinc-600"
      )}>
        {entry.rank <= 3 ? ["🥇","🥈","🥉"][entry.rank - 1] : entry.rank}
      </span>

      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm text-white font-medium truncate">
            {entry.username ?? `Player${entry.userId.slice(-4)}`}
          </span>
          {isCurrentUser && (
            <span className="text-[10px] text-blue-400 bg-blue-500/10 rounded px-1">you</span>
          )}
          {entry.isAlphaCaller && (
            <span className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
              <Bot className="w-2.5 h-2.5" />Alpha Caller
            </span>
          )}
        </div>
        <p className={cn("text-[10px]", color)}>
          {icon} {tier} · {entry.accuracy}% acc · {entry.predictions} picks
        </p>
      </div>

      {/* ELO */}
      <div className="text-right">
        <p className={cn("text-sm font-bold tabular-nums", color)}>{entry.eloScore}</p>
        <p className="text-[10px] text-zinc-600">ELO</p>
      </div>
    </div>
  );
}
