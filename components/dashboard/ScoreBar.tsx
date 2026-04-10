"use client";

import { cn } from "@/lib/utils";
import { getScoreLabel } from "@/lib/scoring/scorer";

interface ScoreBarProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ScoreBar({ score, size = "md", showLabel = true }: ScoreBarProps) {
  const { label, color } = getScoreLabel(score);

  const barColor =
    score >= 75
      ? "bg-emerald-500"
      : score >= 50
      ? "bg-blue-500"
      : score >= 25
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "relative overflow-hidden rounded-full bg-zinc-700/60",
          size === "sm" && "h-1.5 w-16",
          size === "md" && "h-2 w-24",
          size === "lg" && "h-3 w-32"
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn("text-xs font-semibold tabular-nums", color)}>
          {score}
        </span>
      )}
    </div>
  );
}

interface ScoreBreakdownProps {
  liquidityScore: number;
  holderScore: number;
  ageScore: number;
  volumeScore: number;
  suspicionScore: number;
}

export function ScoreBreakdown({
  liquidityScore,
  holderScore,
  ageScore,
  volumeScore,
  suspicionScore,
}: ScoreBreakdownProps) {
  const items = [
    { label: "Liquidity", score: liquidityScore, max: 25 },
    { label: "Holders", score: holderScore, max: 25 },
    { label: "Age", score: ageScore, max: 20 },
    { label: "Vol/MCap", score: volumeScore, max: 20 },
    { label: "Safety", score: suspicionScore, max: 10 },
  ];

  return (
    <div className="space-y-2">
      {items.map(({ label, score, max }) => {
        const pct = (score / max) * 100;
        const barColor =
          pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : pct >= 25 ? "bg-yellow-500" : "bg-red-500";

        return (
          <div key={label} className="flex items-center gap-3">
            <span className="w-16 text-xs text-zinc-500">{label}</span>
            <div className="flex-1 overflow-hidden rounded-full bg-zinc-700/60 h-1.5">
              <div
                className={cn("h-full rounded-full", barColor)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs text-zinc-400 tabular-nums">
              {score}/{max}
            </span>
          </div>
        );
      })}
    </div>
  );
}
