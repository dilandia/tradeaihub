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
import { getServerSession } from "@/lib/get-session";
import { getPool } from "@/lib/db";
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

  const { user } = await getServerSession();
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
    const pool = getPool();
    const subRes = await pool.query(
      `SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );
    let customerId: string | undefined = subRes.rows[0]?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      // Upsert via pg direto (sem RLS)
      await pool.query(
        `INSERT INTO subscriptions (user_id, plan, billing_interval, stripe_customer_id, status, updated_at)
         VALUES ($1, 'free', 'monthly', $2, 'active', NOW())
         ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id, updated_at = NOW()`,
        [user.id, customerId]
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
