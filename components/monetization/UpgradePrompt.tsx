"use client";

import { useState, useTransition } from "react";
import { Zap, Lock, Loader2, TrendingUp, Bell } from "lucide-react";
import Link from "next/link";

interface UpgradePromptProps {
  hiddenCount: number;
}

export function UpgradePrompt({ hiddenCount }: UpgradePromptProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Something went wrong");
          return;
        }
        if (data.url) {
          window.location.href = data.url;
        }
      } catch {
        setError("Network error — please try again");
      }
    });
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-zinc-900 p-6">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/3 to-orange-500/3 pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Lock icon */}
        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <Lock className="h-6 w-6 text-amber-400" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white">
            {hiddenCount} more token{hiddenCount !== 1 ? "s" : ""} hidden
          </h3>
          <p className="text-sm text-zinc-400 mt-0.5">
            Free tier shows the top 10 tokens. Upgrade to Pro for real-time access to all{" "}
            <span className="text-amber-400 font-medium">{hiddenCount + 10}+</span> tokens,
            15-min refresh, and Telegram push alerts.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            {[
              { icon: TrendingUp, text: "All tokens, no limits" },
              { icon: Zap, text: "15-min refresh" },
              { icon: Bell, text: "Telegram push alerts" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1 text-xs text-zinc-400">
                <Icon className="w-3 h-3 text-amber-400" />
                {text}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          <button
            onClick={handleUpgrade}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Upgrade to Pro — $9.99/mo
          </button>
          <Link
            href="/pricing"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            See all features →
          </Link>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
