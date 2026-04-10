import { cookies } from "next/headers";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { SESSION_COOKIE } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST /api/stripe/portal — redirect Pro user to Stripe billing portal
export async function POST() {
  if (!isStripeConfigured()) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return Response.json({ error: "No session" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: sessionId } });
  if (!user?.stripeCustomerId) {
    return Response.json({ error: "No active subscription" }, { status: 404 });
  }

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/pricing`,
  });

  return Response.json({ url: portal.url });
}
