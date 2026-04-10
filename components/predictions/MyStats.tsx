"use client";

import { useEffect, useState } from "react";
import { getEloTier, calcAccuracy } from "@/lib/elo";
import { cn, formatUsd } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Bot } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UserData {
  id: string;
  eloScore: number;
  totalPredictions: number;
  correctPredictions: number;
  username: string | null;
  badges: { badge: string }[];
}

interface Prediction {
  id: string;
  direction: string;
  confidence: number;
  resolved: boolean;
  correct: boolean | null;
  eloChange: number | null;
  priceAtPrediction: number | null;
  priceAtResolution: number | null;
  expiresAt: string;
  createdAt: string;
  token: {
    id: string;
    symbol: string;
    name: string;
    chain: string;
    priceUsd: number | null;
    totalScore: number;
  };
}

export function MyStats() {
  const [user, setUser] = useState<UserData | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [tab, setTab] = useState<"active" | "resolved">("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/user").then((r) => r.json()),
      fetch(`/api/predictions?filter=${tab}`).then((r) => r.json()),
    ])
      .then(([userData, predData]) => {
        setUser(userData.user);
        setPredictions(predData.predictions ?? []);
      })
      .finally(() => setLoading(false));
  }, [tab]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <p className="text-sm text-zinc-500 text-center py-8">
        Make your first prediction to see your stats here.
      </p>
    );
  }

  const { tier, color, icon } = getEloTier(user.eloScore);
  const accuracy = calcAccuracy(user.correctPredictions, user.totalPredictions);
  const hasAlphaCaller = user.badges.some((b) => b.badge === "ALPHA_CALLER");

  return (
    <div className="space-y-4">
      {/* ELO card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex items-center gap-4">
        <div className="text-4xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn("text-2xl font-bold tabular-nums", color)}>{user.eloScore}</p>
            <span className={cn("text-sm font-medium", color)}>{tier}</span>
            {hasAlphaCaller && (
              <span className="flex items-center gap-1 text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-1.5 py-0.5">
                <Bot className="w-2.5 h-2.5" /> Alpha Caller
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            {user.username
              ? `@${user.username}`
              : <span className="text-zinc-600 italic">Anonymous player</span>}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">{accuracy}%</p>
          <p className="text-[10px] text-zinc-500">accuracy</p>
          <p className="text-sm font-semibold text-white mt-1">{user.totalPredictions}</p>
          <p className="text-[10px] text-zinc-500">predictions</p>
        </div>
      </div>

      {/* Prediction list tabs */}
      <div className="flex rounded-lg border border-zinc-800 p-0.5 bg-zinc-900 w-fit">
        {(["active", "resolved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors",
              tab === t ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {t === "active" ? "Active" : "History"}
          </button>
        ))}
      </div>

      {predictions.length === 0 ? (
        <p className="text-sm text-zinc-600 text-center py-6">
          {tab === "active" ? "No active predictions." : "No resolved predictions yet."}
        </p>
      ) : (
        <div className="space-y-2">
          {predictions.map((p) => (
            <PredictionRow key={p.id} prediction={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PredictionRow({ prediction: p }: { prediction: Prediction }) {
  const isUp = p.direction === "UP";
  const resolvedAt = p.resolved;
  const timeLeft = !resolvedAt
    ? Math.max(0, new Date(p.expiresAt).getTime() - Date.now())
    : null;
  const hoursLeft = timeLeft !== null ? Math.floor(timeLeft / 3_600_000) : null;
  const minsLeft = timeLeft !== null ? Math.floor((timeLeft % 3_600_000) / 60_000) : null;

  const priceChange =
    p.priceAtPrediction && p.priceAtResolution
      ? ((p.priceAtResolution - p.priceAtPrediction) / p.priceAtPrediction) * 100
      : null;

  return (
    <div className={cn(
      "rounded-lg border px-3 py-2.5 flex items-center gap-3",
      p.resolved
        ? p.correct
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-red-500/20 bg-red-500/5"
        : "border-zinc-800 bg-zinc-900/50"
    )}>
      {/* Direction icon */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
        isUp ? "bg-emerald-500/15" : "bg-red-500/15"
      )}>
        {isUp
          ? <TrendingUp className="w-4 h-4 text-emerald-400" />
          : <TrendingDown className="w-4 h-4 text-red-400" />}
      </div>

      {/* Token + direction */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-white">{p.token.symbol}</span>
          <span className="text-[10px] text-zinc-500">{p.token.chain}</span>
          <span className={cn(
            "text-[10px] font-medium",
            isUp ? "text-emerald-400" : "text-red-400"
          )}>{p.direction}</span>
          <span className="text-[10px] text-zinc-600">·{p.confidence}% conf</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {p.resolved ? (
            <>
              {p.correct !== null && (
                p.correct
                  ? <CheckCircle className="w-3 h-3 text-emerald-400" />
                  : <XCircle className="w-3 h-3 text-red-400" />
              )}
              {priceChange !== null && (
                <span className={cn("text-[10px]", priceChange >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(1)}%
                </span>
              )}
            </>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-zinc-500">
              <Clock className="w-2.5 h-2.5" />
              {hoursLeft}h {minsLeft}m left
            </span>
          )}
        </div>
      </div>

      {/* ELO result */}
      <div className="text-right">
        {p.resolved && p.eloChange !== null ? (
          <span className={cn(
            "text-sm font-bold tabular-nums",
            p.eloChange > 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {p.eloChange > 0 ? "+" : ""}{p.eloChange}
          </span>
        ) : (
          <span className="text-[10px] text-zinc-600">pending</span>
        )}
        <p className="text-[10px] text-zinc-600">ELO</p>
      </div>
    </div>
  );
}
