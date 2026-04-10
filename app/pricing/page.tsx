"use client";

import { useState, useTransition } from "react";
import { Navbar } from "@/components/Navbar";
import { PLANS } from "@/lib/stripe";
import { Check, X, Zap, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PricingContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "1";
  const canceled = searchParams.get("canceled") === "1";

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

  const free = PLANS.FREE;
  const pro = PLANS.PRO;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Simple, transparent pricing
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Start free. Upgrade when you need real-time data and alerts.
          </p>
        </div>

        {/* Success / canceled banners */}
        {success && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-center">
            <p className="text-emerald-400 font-medium">
              Welcome to Pro! Your subscription is active. Enjoy unlimited access.
            </p>
          </div>
        )}
        {canceled && (
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-5 py-4 text-center">
            <p className="text-zinc-400">
              Checkout canceled — no charge was made. You can upgrade any time.
            </p>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
          {/* Free plan */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-6">
            <div>
              <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Free</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-zinc-500 text-sm">/month</span>
              </div>
              <p className="text-sm text-zinc-500 mt-1">No credit card required</p>
            </div>

            <Link
              href="/"
              className="block w-full text-center px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:border-zinc-500 hover:text-white transition-colors"
            >
              Get started free
            </Link>

            <div className="space-y-3">
              {free.features.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-zinc-300">{f}</span>
                </div>
              ))}
              {free.missing.map((f) => (
                <div key={f} className="flex items-start gap-2.5 opacity-40">
                  <X className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-zinc-500">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro plan */}
          <div className="relative rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/8 via-zinc-900 to-zinc-900 p-6 space-y-6 shadow-lg shadow-amber-500/5">
            {/* Popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-black uppercase tracking-wide">
                <Zap className="w-3 h-3" />
                Most Popular
              </span>
            </div>

            <div>
              <p className="text-sm font-medium text-amber-400 uppercase tracking-wider">Pro</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">${pro.price}</span>
                <span className="text-zinc-500 text-sm">/month</span>
              </div>
              <p className="text-sm text-zinc-500 mt-1">Cancel anytime</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleUpgrade}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Upgrade to Pro
              </button>
              {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            </div>

            <div className="space-y-3">
              {pro.features.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-zinc-200">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature comparison table */}
        <div className="max-w-3xl mx-auto w-full">
          <h2 className="text-lg font-semibold text-white mb-4 text-center">Full comparison</h2>
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-left px-5 py-3 text-zinc-400 font-medium">Feature</th>
                  <th className="text-center px-5 py-3 text-zinc-400 font-medium">Free</th>
                  <th className="text-center px-5 py-3 text-amber-400 font-medium">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {[
                  { feature: "Tokens visible", free: "Top 10", pro: "All (100+)" },
                  { feature: "Data refresh", free: "Every 6 hours", pro: "Every 15 minutes" },
                  { feature: "Supported chains", free: "Base + Solana", pro: "Base + Solana" },
                  { feature: "AI scoring (0–100)", free: true, pro: true },
                  { feature: "Honeypot detection", free: true, pro: true },
                  { feature: "Prediction game", free: true, pro: true },
                  { feature: "ELO leaderboard", free: true, pro: true },
                  { feature: "Vs AI mode", free: true, pro: true },
                  { feature: "Telegram push alerts", free: false, pro: true },
                  { feature: "Priority scan queue", free: false, pro: true },
                  { feature: "Pro badge on leaderboard", free: false, pro: true },
                  { feature: "Filters & sorting", free: true, pro: true },
                  { feature: "Pagination (all pages)", free: false, pro: true },
                ].map(({ feature, free: freeVal, pro: proVal }) => (
                  <tr key={feature} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-5 py-3 text-zinc-300">{feature}</td>
                    <td className="px-5 py-3 text-center">
                      {typeof freeVal === "boolean" ? (
                        freeVal ? (
                          <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-zinc-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-zinc-400">{freeVal}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {typeof proVal === "boolean" ? (
                        proVal ? (
                          <Check className="w-4 h-4 text-amber-400 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-zinc-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-amber-300 font-medium">{proVal}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto w-full space-y-4">
          <h2 className="text-lg font-semibold text-white text-center">FAQ</h2>
          {[
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel through your account dashboard — you keep Pro access until the end of your billing period.",
            },
            {
              q: "Is my payment secure?",
              a: "Payments are processed by Stripe. We never store your card details.",
            },
            {
              q: "What chains are supported?",
              a: "Base and Solana. More chains may be added based on demand.",
            },
            {
              q: "How do Telegram alerts work?",
              a: "Pro subscribers receive a Telegram message whenever a newly scanned token scores 80+. You'll get the token name, score, price, and a direct DEX link.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-5 py-4 space-y-1">
              <p className="font-medium text-white text-sm">{q}</p>
              <p className="text-sm text-zinc-400">{a}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}
