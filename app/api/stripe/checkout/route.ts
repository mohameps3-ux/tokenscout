import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getStripe, PRO_PRICE_ID, isStripeConfigured } from "@/lib/stripe";
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

  if (user.tier === "PRO") {
    return Response.json({ error: "Already subscribed to Pro" }, { status: 409 });
  }

  if (!PRO_PRICE_ID || PRO_PRICE_ID === "price_placeholder") {
    return Response.json(
      { error: "STRIPE_PRO_PRICE_ID is not configured. Create a price in Stripe dashboard." },
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

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
    success_url: `${appUrl}/pricing?success=1`,
    cancel_url: `${appUrl}/pricing?canceled=1`,
    metadata: { tokenscoutUserId: user.id },
    subscription_data: {
      metadata: { tokenscoutUserId: user.id },
    },
    allow_promotion_codes: true,
  });

  return Response.json({ url: session.url });
}
