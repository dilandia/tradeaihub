/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session.
 *
 * The portal allows: update payment method, view invoices, cancel subscription.
 * Returns: { url: string }
 */
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
import { getPool } from "@/lib/db";
import Stripe from "stripe";

export async function POST() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 }
    );
  }

  const { user } = await getServerSession();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get stripe_customer_id from subscriptions table
    const pool = getPool();
    const subRes = await pool.query(
      `SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );
    const customerId: string | undefined = subRes.rows[0]?.stripe_customer_id;
    if (!customerId) {
      return NextResponse.json(
        { error: "No Stripe customer found. Please subscribe to a plan first." },
        { status: 404 }
      );
    }

    const stripe = new Stripe(secretKey);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/settings/subscription`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[stripe/portal]", err);
    const message =
      err instanceof Error ? err.message : "Failed to create portal session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
