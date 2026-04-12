"use client";

import { useState, useTransition } from "react";
import { Navbar } from "@/components/Navbar";
import { Check, X, Zap, Loader2, Crown, Star, Infinity } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface PlanDef {
  key: string;
  name: string;
  price: number;
  billing: "free" | "monthly" | "once";
  badge?: { label: string; color: string };
  accent: string;         // Tailwind border/text color token
  accentBg: string;
  buttonClass: string;
  icon: React.ReactNode;
  features: string[];
  missing: string[];
}

const PLANS: PlanDef[] = [
  {
    key: "FREE",
    name: "Free",
    price: 0,
    billing: "free",
    accent: "border-zinc-700",
    accentBg: "",
    buttonClass: "border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white",
    icon: <Star className="w-4 h-4" />,
    features: [
      "Top 10 tokens per scan",
      "6-hour data refresh",
      "Safety score (0–100)",
      "Honeypot detection",
      "Prediction game",
      "ELO leaderboard",
    ],
    missing: [
      "Real-time data",
      "Full token list",
      "Telegram alerts",
      "Advanced filters",
      "AI predictions",
      "Anti-rug detection",
    ],
  },
  {
    key: "PRO",
    name: "Pro",
    price: 9.99,
    billing: "monthly",
    badge: { label: "Most Popular", color: "bg-amber-500 text-black" },
    accent: "border-amber-500/50",
    accentBg: "from-amber-500/8 via-zinc-900 to-zinc-900",
    buttonClass: "bg-amber-500 hover:bg-amber-400 text-black font-semibold",
    icon: <Zap className="w-4 h-4" />,
    features: [
      "All tokens — no limits",
      "15-minute refresh",
      "Telegram push alerts (score > 80)",
      "Priority scan queue",
      "Prediction game (unlimited)",
      "Pro badge on leaderboard",
    ],
    missing: [
      "Advanced filters",
      "AI predictions",
      "Anti-rug detection",
      "Priority alerts",
    ],
  },
  {
    key: "SUPER_PRO",
    name: "Super Pro",
    price: 19.99,
    billing: "monthly",
    badge: { label: "Best Value", color: "bg-blue-500 text-white" },
    accent: "border-blue-500/50",
    accentBg: "from-blue-500/8 via-zinc-900 to-zinc-900",
    buttonClass: "bg-blue-600 hover:bg-blue-500 text-white font-semibold",
    icon: <Crown className="w-4 h-4" />,
    features: [
      "Everything in Pro",
      "5-minute refresh",
      "Advanced filters & analytics",
      "AI-powered predictions",
      "Anti-rug detection",
      "Priority Telegram alerts",
      "Super Pro badge",
    ],
    missing: [],
  },
  {
    key: "LIFETIME",
    name: "Lifetime",
    price: 149.99,
    billing: "once",
    badge: { label: "Best Deal", color: "bg-emerald-500 text-black" },
    accent: "border-emerald-500/50",
    accentBg: "from-emerald-500/8 via-zinc-900 to-zinc-900",
    buttonClass: "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold",
    icon: <Infinity className="w-4 h-4" />,
    features: [
      "Everything in Super Pro",
      "1-minute refresh (near real-time)",
      "One-time payment — no monthly fee",
      "API access (100 req/day)",
      "Custom Telegram alert rules",
      "Portfolio tracker (50 tokens)",
      "Private Discord channel",
      "Lifetime badge on leaderboard",
      "Vote on new feature roadmap",
      "All future features included",
    ],
    missing: [],
  },
];

const COMPARISON_ROWS = [
  { label: "Tokens visible",       free: "Top 10",        pro: "All",            super: "All",          life: "All" },
  { label: "Data refresh",         free: "Every 6h",      pro: "Every 15min",    super: "Every 5min",   life: "Every 5min" },
  { label: "Safety score (0–100)", free: true,            pro: true,             super: true,           life: true },
  { label: "Honeypot detection",   free: true,            pro: true,             super: true,           life: true },
  { label: "Prediction game",      free: true,            pro: true,             super: true,           life: true },
  { label: "ELO leaderboard",      free: true,            pro: true,             super: true,           life: true },
  { label: "Telegram alerts",      free: false,           pro: true,             super: true,           life: true },
  { label: "Priority alerts",      free: false,           pro: false,            super: true,           life: true },
  { label: "Advanced filters",     free: false,           pro: false,            super: true,           life: true },
  { label: "AI predictions",       free: false,           pro: false,            super: true,           life: true },
  { label: "Anti-rug detection",   free: false,           pro: false,            super: true,           life: true },
  { label: "API access",            free: false,           pro: false,            super: false,          life: "100 req/day" },
  { label: "Portfolio tracker",    free: false,           pro: false,            super: false,          life: "50 tokens" },
  { label: "Custom alert rules",   free: false,           pro: false,            super: false,          life: true },
  { label: "Private Discord",      free: false,           pro: false,            super: false,          life: true },
  { label: "Early feature access", free: false,           pro: false,            super: false,          life: true },
  { label: "Feature vote",         free: false,           pro: false,            super: false,          life: true },
  { label: "Billing",              free: "Free forever",  pro: "$9.99/mo",       super: "$19.99/mo",    life: "One-time $149.99" },
] as const;

function Cell({ value, accent }: { value: boolean | string; accent: string }) {
  if (typeof value === "boolean") {
    return value
      ? <Check className={`w-4 h-4 mx-auto ${accent}`} />
      : <X className="w-4 h-4 text-zinc-700 mx-auto" />;
  }
  return <span className={`text-xs ${accent}`}>{value}</span>;
}

function PricingContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "1";
  const canceled = searchParams.get("canceled") === "1";
  const successTier = searchParams.get("tier");

  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleCheckout = (tier: string) => {
    setError(null);
    setPending(tier);
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Something went wrong");
          setPending(null);
          return;
        }
        if (data.url) window.location.href = data.url;
      } catch {
        setError("Network error — please try again");
        setPending(null);
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Simple, transparent pricing
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Start free. Upgrade when you need real-time data, alerts, and AI-powered insights.
          </p>
        </div>

        {/* Banners */}
        {success && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-center">
            <p className="text-emerald-400 font-medium">
              {successTier === "lifetime"
                ? "Welcome, Lifetime member! You now have unlimited access forever."
                : `Welcome to ${successTier === "super_pro" ? "Super Pro" : "Pro"}! Your subscription is now active.`}
            </p>
          </div>
        )}
        {canceled && (
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-5 py-4 text-center">
            <p className="text-zinc-400">Checkout canceled — no charge was made. You can upgrade any time.</p>
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-xl border bg-gradient-to-br ${plan.accent} ${plan.accentBg || "bg-zinc-900"} p-6 flex flex-col gap-5`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${plan.badge.color}`}>
                    {plan.icon}{plan.badge.label}
                  </span>
                </div>
              )}

              {/* Price */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">{plan.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-zinc-500 text-sm">
                    {plan.billing === "free" ? "" : plan.billing === "once" ? " one-time" : "/mo"}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 mt-1">
                  {plan.billing === "free" ? "No credit card required"
                   : plan.billing === "once" ? "Pay once, use forever"
                   : "Cancel anytime"}
                </p>
              </div>

              {/* CTA */}
              {plan.key === "FREE" ? (
                <Link
                  href="/"
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors ${plan.buttonClass}`}
                >
                  Get started free
                </Link>
              ) : (
                <button
                  onClick={() => handleCheckout(plan.key)}
                  disabled={pending !== null}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${plan.buttonClass}`}
                >
                  {pending === plan.key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    plan.icon
                  )}
                  {plan.billing === "once" ? `Buy ${plan.name}` : `Upgrade to ${plan.name}`}
                </button>
              )}

              {/* Features */}
              <div className="flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-zinc-300">{f}</span>
                  </div>
                ))}
                {plan.missing.map((f) => (
                  <div key={f} className="flex items-start gap-2 opacity-35">
                    <X className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-zinc-500">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 text-center">Full comparison</h2>
          <div className="rounded-xl border border-zinc-800 overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  <th className="text-left px-5 py-3 text-zinc-400 font-medium w-1/3">Feature</th>
                  <th className="text-center px-4 py-3 text-zinc-400 font-medium">Free</th>
                  <th className="text-center px-4 py-3 text-amber-400 font-medium">Pro</th>
                  <th className="text-center px-4 py-3 text-blue-400 font-medium">Super Pro</th>
                  <th className="text-center px-4 py-3 text-emerald-400 font-medium">Lifetime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-5 py-3 text-zinc-300">{row.label}</td>
                    <td className="px-4 py-3 text-center"><Cell value={row.free} accent="text-zinc-400" /></td>
                    <td className="px-4 py-3 text-center"><Cell value={row.pro}  accent="text-amber-400" /></td>
                    <td className="px-4 py-3 text-center"><Cell value={row.super} accent="text-blue-400" /></td>
                    <td className="px-4 py-3 text-center"><Cell value={row.life}  accent="text-emerald-400" /></td>
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
            { q: "Can I cancel anytime?", a: "Yes. Cancel through your account dashboard — you keep access until the end of your billing period." },
            { q: "What is the Lifetime plan?", a: "A one-time payment of $49.99 that gives you Super Pro access forever with no recurring fees and early access to every new feature." },
            { q: "Is my payment secure?", a: "Payments are processed by Stripe. We never store your card details." },
            { q: "Can I upgrade or downgrade between plans?", a: "Yes. You can switch between Pro and Super Pro at any time via your billing portal. Your billing is prorated." },
            { q: "What chains are supported?", a: "Base and Solana today. More chains are planned based on demand." },
            { q: "How do Telegram alerts work?", a: "Pro and above subscribers receive a Telegram message whenever a newly scanned token scores 80+, with the name, price, score, and a direct DEX link." },
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
