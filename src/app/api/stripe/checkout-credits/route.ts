/**
 * POST /api/stripe/checkout-credits
 * Cria sessão de checkout Stripe para compra de pacotes de créditos (one-time).
 *
 * Variáveis de ambiente:
 * - STRIPE_SECRET_KEY
 * - STRIPE_CREDITS_20_PRICE_ID
 * - STRIPE_CREDITS_50_PRICE_ID
 * - STRIPE_CREDITS_100_PRICE_ID
 * - NEXT_PUBLIC_APP_URL
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserPlan } from "@/lib/plan";
import Stripe from "stripe";

const CREDIT_PACKS: Record<string, { priceId: string; credits: number; amountUsd: number }> = {
  "20": {
    priceId: process.env.STRIPE_CREDITS_20_PRICE_ID ?? "",
    credits: 20,
    amountUsd: 2.99,
  },
  "50": {
    priceId: process.env.STRIPE_CREDITS_50_PRICE_ID ?? "",
    credits: 50,
    amountUsd: 5.99,
  },
  "100": {
    priceId: process.env.STRIPE_CREDITS_100_PRICE_ID ?? "",
    credits: 100,
    amountUsd: 9.99,
  },
};

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe not configured. Add STRIPE_SECRET_KEY to .env" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id || !user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getUserPlan(user.id);
  if (plan !== "pro" && plan !== "elite") {
    return NextResponse.json(
      { error: "Credits purchase requires Pro or Elite plan" },
      { status: 403 }
    );
  }

  let body: { packId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { packId } = body;
  const pack = packId ? CREDIT_PACKS[packId] : null;
  if (!pack || !pack.priceId) {
    return NextResponse.json(
      { error: `Invalid or unconfigured pack: ${packId ?? "missing"}` },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const stripe = new Stripe(secretKey);

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = sub?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      // Use admin client: RLS blocks user INSERT/UPDATE on subscriptions (TDR-03)
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin.from("subscriptions").upsert(
        {
          user_id: user.id,
          plan: "free",
          billing_interval: "monthly",
          stripe_customer_id: customerId,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [{ price: pack.priceId, quantity: 1 }],
      success_url: `${appUrl}/settings/subscription?credits_success=true`,
      cancel_url: `${appUrl}/settings/subscription?credits_canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        credits_type: "purchase",
        credits_amount: String(pack.credits),
        credits_amount_usd: String(pack.amountUsd),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout-credits]", err);
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
