import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getStripe, PRO_PRICE_ID, SUPER_PRO_PRICE_ID, LIFETIME_PRICE_ID, isStripeConfigured } from "@/lib/stripe";
import { SESSION_COOKIE } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return Response.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local" },
      { status: 503 }
    );
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return Response.json({ error: "No session — visit the site first" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: sessionId } });
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Determine which plan is being purchased
  const body = await request.json().catch(() => ({}));
  const tier: string = body.tier ?? "PRO";

  const TIER_CONFIG: Record<string, { priceId: string; mode: "subscription" | "payment"; label: string }> = {
    PRO:       { priceId: PRO_PRICE_ID,       mode: "subscription", label: "Pro" },
    SUPER_PRO: { priceId: SUPER_PRO_PRICE_ID, mode: "subscription", label: "Super Pro" },
    LIFETIME:  { priceId: LIFETIME_PRICE_ID,  mode: "payment",      label: "Lifetime" },
  };

  const config = TIER_CONFIG[tier];
  if (!config) {
    return Response.json({ error: "Invalid tier" }, { status: 400 });
  }

  if (!config.priceId || config.priceId === "price_placeholder") {
    return Response.json(
      { error: `STRIPE_${tier}_PRICE_ID is not configured. Create a price in the Stripe dashboard.` },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Reuse existing Stripe customer if we have one
  let customerId = user.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { tokenscoutUserId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const baseSessionParams = {
    customer: customerId,
    line_items: [{ price: config.priceId, quantity: 1 }],
    success_url: `${appUrl}/pricing?success=1&tier=${tier.toLowerCase()}`,
    cancel_url: `${appUrl}/pricing?canceled=1`,
    metadata: { tokenscoutUserId: user.id, tier },
    allow_promotion_codes: true,
  };

  const session = await stripe.checkout.sessions.create(
    config.mode === "subscription"
      ? { ...baseSessionParams, mode: "subscription", subscription_data: { metadata: { tokenscoutUserId: user.id, tier } } }
      : { ...baseSessionParams, mode: "payment" }
  );

  return Response.json({ url: session.url });
}
