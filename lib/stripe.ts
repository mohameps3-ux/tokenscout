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

export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? "";

export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    tokens: 10,
    refreshMinutes: 360, // 6 hours
    features: [
      "Top 10 tokens per scan",
      "6-hour data refresh",
      "Prediction game (unlimited)",
      "ELO leaderboard",
      "Vs AI mode",
    ],
    missing: [
      "Real-time token updates",
      "Full token list (100+)",
      "Telegram push alerts",
      "Pro badge",
    ],
  },
  PRO: {
    name: "Pro",
    price: 9.99,
    tokens: null, // unlimited
    refreshMinutes: 15,
    features: [
      "All tokens — no limits",
      "15-minute refresh (real-time)",
      "Telegram push alerts (score > 80)",
      "Priority scan queue",
      "Prediction game (unlimited)",
      "Pro badge on leaderboard",
    ],
    missing: [],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
