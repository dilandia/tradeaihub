/**
 * POST /api/stripe/checkout
 * Cria sessão de checkout Stripe para upgrade de plano.
 * Supports multi-currency: USD, BRL, EUR.
 *
 * Variáveis de ambiente necessárias:
 * - STRIPE_SECRET_KEY
 * - STRIPE_PRO_MONTHLY_PRICE_ID (USD), _BRL, _EUR
 * - STRIPE_PRO_ANNUAL_PRICE_ID (USD), _BRL, _EUR
 * - STRIPE_ELITE_MONTHLY_PRICE_ID (USD), _BRL, _EUR
 * - STRIPE_ELITE_ANNUAL_PRICE_ID (USD), _BRL, _EUR
 * - NEXT_PUBLIC_APP_URL
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import { SUPPORTED_CURRENCIES } from "@/lib/format-currency";

type Currency = "usd" | "brl" | "eur";

const PRICE_IDS: Record<string, Record<string, Record<Currency, string>>> = {
  pro: {
    monthly: {
      usd: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
      brl: process.env.STRIPE_PRO_MONTHLY_PRICE_ID_BRL ?? "",
      eur: process.env.STRIPE_PRO_MONTHLY_PRICE_ID_EUR ?? "",
    },
    annual: {
      usd: process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? "",
      brl: process.env.STRIPE_PRO_ANNUAL_PRICE_ID_BRL ?? "",
      eur: process.env.STRIPE_PRO_ANNUAL_PRICE_ID_EUR ?? "",
    },
  },
  elite: {
    monthly: {
      usd: process.env.STRIPE_ELITE_MONTHLY_PRICE_ID ?? "",
      brl: process.env.STRIPE_ELITE_MONTHLY_PRICE_ID_BRL ?? "",
      eur: process.env.STRIPE_ELITE_MONTHLY_PRICE_ID_EUR ?? "",
    },
    annual: {
      usd: process.env.STRIPE_ELITE_ANNUAL_PRICE_ID ?? "",
      brl: process.env.STRIPE_ELITE_ANNUAL_PRICE_ID_BRL ?? "",
      eur: process.env.STRIPE_ELITE_ANNUAL_PRICE_ID_EUR ?? "",
    },
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
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch {
    // Auth check failed silently — user remains null
  }
  if (!user?.id || !user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { planId?: string; interval?: "monthly" | "annual"; currency?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { planId, interval = "monthly", currency = "usd" } = body;
  if (!planId || !["pro", "elite"].includes(planId)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const normalizedCurrency = currency.toLowerCase() as Currency;
  if (!SUPPORTED_CURRENCIES.includes(normalizedCurrency)) {
    return NextResponse.json(
      { error: `Unsupported currency: ${currency}. Supported: ${SUPPORTED_CURRENCIES.join(", ")}` },
      { status: 400 }
    );
  }

  const priceId = PRICE_IDS[planId]?.[interval]?.[normalizedCurrency];
  if (!priceId) {
    return NextResponse.json(
      { error: `Price ID not configured for ${planId}/${interval}/${normalizedCurrency}` },
      { status: 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const stripe = new Stripe(secretKey);

    // Buscar ou criar Stripe Customer
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
      mode: "subscription",
      locale: "auto",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/settings/subscription?success=true`,
      cancel_url: `${appUrl}/settings/subscription?canceled=true`,
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan: planId, interval, currency: normalizedCurrency },
      },
      metadata: { supabase_user_id: user.id, plan: planId, interval, currency: normalizedCurrency },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
