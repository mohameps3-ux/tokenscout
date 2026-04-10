"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Loader2, CheckCircle, Bot } from "lucide-react";
import type { AiPrediction } from "@/lib/ai-predictor";

interface PredictButtonProps {
  tokenId: string;
  tokenSymbol: string;
  aiPrediction: AiPrediction;
  existingPrediction?: { direction: string; resolved: boolean } | null;
  onSuccess?: (direction: string) => void;
}

export function PredictButton({
  tokenId,
  tokenSymbol,
  aiPrediction,
  existingPrediction,
  onSuccess,
}: PredictButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [confidence, setConfidence] = useState(65);
  const [result, setResult] = useState<{
    direction: string;
    eloHint: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfidence, setShowConfidence] = useState(false);
  const [pendingDirection, setPendingDirection] = useState<"UP" | "DOWN" | null>(null);

  const hasPrediction = !!existingPrediction || !!result;

  const handlePick = (direction: "UP" | "DOWN") => {
    if (hasPrediction) return;
    setPendingDirection(direction);
    setShowConfidence(true);
  };

  const handleSubmit = () => {
    if (!pendingDirection) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/predictions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokenId, direction: pendingDirection, confidence }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to submit");
          setShowConfidence(false);
          setPendingDirection(null);
          return;
        }
        const maxGain = Math.round((confidence - 50) * 0.4 + 10);
        setResult({
          direction: pendingDirection,
          eloHint: `+${maxGain} ELO if correct`,
        });
        setShowConfidence(false);
        onSuccess?.(pendingDirection);
      } catch {
        setError("Network error — try again");
        setShowConfidence(false);
        setPendingDirection(null);
      }
    });
  };

  // Already predicted
  if (hasPrediction) {
    const dir = result?.direction ?? existingPrediction?.direction;
    return (
      <div className="space-y-2">
        <div className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
          dir === "UP"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
            : "bg-red-500/10 text-red-400 border border-red-500/30"
        )}>
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span>You called {dir} · resolves in 4h</span>
        </div>
        {result?.eloHint && (
          <p className="text-[10px] text-zinc-600 text-center">{result.eloHint}</p>
        )}
        <AiBadge prediction={aiPrediction} />
      </div>
    );
  }

  // Confidence picker shown after direction pick
  if (showConfidence && pendingDirection) {
    return (
      <div className="space-y-2.5">
        <p className="text-xs text-zinc-400 text-center">
          Confidence in your{" "}
          <span className={pendingDirection === "UP" ? "text-emerald-400" : "text-red-400"}>
            {pendingDirection}
          </span>{" "}
          call?
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600 w-8">50%</span>
          <input
            type="range"
            min={50}
            max={100}
            value={confidence}
            onChange={(e) => setConfidence(parseInt(e.target.value))}
            className="flex-1 accent-blue-500 h-1.5"
          />
          <span className="text-[10px] text-zinc-300 w-8 text-right">{confidence}%</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowConfidence(false); setPendingDirection(null); }}
            className="flex-1 h-8 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className={cn(
              "flex-1 h-8 rounded-lg text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5",
              isPending ? "bg-zinc-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"
            )}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-zinc-500 text-center uppercase tracking-widest">
        +20% in 4h?
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => handlePick("UP")}
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-emerald-600/20 border border-emerald-600/40 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/30 transition-colors"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          UP
        </button>
        <button
          onClick={() => handlePick("DOWN")}
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-red-600/20 border border-red-600/40 text-red-400 text-xs font-semibold hover:bg-red-600/30 transition-colors"
        >
          <TrendingDown className="w-3.5 h-3.5" />
          DOWN
        </button>
      </div>
      {error && <p className="text-[10px] text-red-400 text-center">{error}</p>}
      <AiBadge prediction={aiPrediction} />
    </div>
  );
}

function AiBadge({ prediction }: { prediction: AiPrediction }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 justify-center">
      <Bot className="w-3 h-3 text-violet-500" />
      <span>
        AI says{" "}
        <span
          className={
            prediction.direction === "UP" ? "text-emerald-500" : "text-red-500"
          }
        >
          {prediction.direction}
        </span>{" "}
        ({prediction.confidence}% conf)
      </span>
    </div>
  );
}
