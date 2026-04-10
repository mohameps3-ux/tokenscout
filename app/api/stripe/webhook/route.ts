import { NextRequest } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

// Disable body parsing — Stripe needs the raw body for signature verification
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret.includes("placeholder")) {
    console.warn("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature check");
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  const stripe = getStripe();

  try {
    if (webhookSecret && !webhookSecret.includes("placeholder")) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Dev fallback: parse without verifying (never do this in production)
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Stripe Webhook] Signature verification failed:", msg);
    return Response.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Received: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDelete(sub);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(`[Stripe Webhook] Payment failed for customer: ${invoice.customer}`);
        break;
      }
      default:
        // Ignore unhandled event types
        break;
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, err);
    return Response.json(
      { error: "Internal error processing webhook" },
      { status: 500 }
    );
  }

  return Response.json({ received: true });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.tokenscoutUserId;
  if (!userId) {
    console.warn("[Stripe] No tokenscoutUserId in checkout metadata");
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      tier: "PRO",
      stripeCustomerId: typeof session.customer === "string"
        ? session.customer
        : session.customer?.id ?? undefined,
    },
  });

  console.log(`[Stripe] Upgraded user ${userId} to PRO`);
}

async function handleSubscriptionUpdate(sub: Stripe.Subscription) {
  const userId = sub.metadata?.tokenscoutUserId;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // Find user by customer ID if metadata missing
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });

  if (!user) {
    console.warn(`[Stripe] No user found for customer ${customerId}`);
    return;
  }

  const isActive = sub.status === "active" || sub.status === "trialing";
  await prisma.user.update({
    where: { id: user.id },
    data: { tier: isActive ? "PRO" : "FREE" },
  });

  console.log(`[Stripe] User ${user.id} subscription: ${sub.status} → tier: ${isActive ? "PRO" : "FREE"}`);
}

async function handleSubscriptionDelete(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { tier: "FREE" },
  });

  console.log(`[Stripe] User ${user.id} downgraded to FREE (subscription deleted)`);
}
