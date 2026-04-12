import Stripe from "stripe";

// Singleton Stripe client
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.startsWith("sk_test_placeholder") || key === "") {
      throw new Error(
        "STRIPE_SECRET_KEY is not configured. Add it to .env.local"
      );
    }
    _stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
  }
  return _stripe;
}

/** True when Stripe keys are actually set (not placeholder values) */
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.length > 10 && !key.includes("placeholder");
}

export const PRO_PRICE_ID       = process.env.STRIPE_PRO_PRICE_ID        ?? "";
export const SUPER_PRO_PRICE_ID = process.env.STRIPE_SUPER_PRO_PRICE_ID  ?? "";
export const LIFETIME_PRICE_ID  = process.env.STRIPE_LIFETIME_PRICE_ID   ?? "";

export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    billing: "free" as const,
    tokens: 10,
    refreshMinutes: 360,
    priceId: null,
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
  PRO: {
    name: "Pro",
    price: 9.99,
    billing: "monthly" as const,
    tokens: null,
    refreshMinutes: 15,
    priceId: PRO_PRICE_ID,
    features: [
      "All tokens — no limits",
      "15-minute refresh (real-time)",
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
  SUPER_PRO: {
    name: "Super Pro",
    price: 19.99,
    billing: "monthly" as const,
    tokens: null,
    refreshMinutes: 5,
    priceId: SUPER_PRO_PRICE_ID,
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
  LIFETIME: {
    name: "Lifetime",
    price: 149.99,
    billing: "once" as const,
    tokens: null,
    refreshMinutes: 1,
    priceId: LIFETIME_PRICE_ID,
    features: [
      "Everything in Super Pro",
      "1-minute refresh (near real-time)",
      "One-time payment — no monthly fee",
      "API access (100 req/day)",
      "Custom Telegram alert rules",
      "Portfolio tracker (up to 50 tokens)",
      "Private Discord channel",
      "Lifetime badge on leaderboard",
      "Vote on new feature roadmap",
      "All future features included",
    ],
    missing: [],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
