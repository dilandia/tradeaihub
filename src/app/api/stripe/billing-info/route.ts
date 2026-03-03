/**
 * GET /api/stripe/billing-info
 * Fetches billing information from Stripe for the authenticated user.
 *
 * Returns: { card, nextCharge, portalUrl }
 * - card: { brand, last4, expMonth, expYear } | null
 * - nextCharge: { amount, date, interval } | null
 * - portalUrl: string | null
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { formatCurrencyAmount } from "@/lib/format-currency";

export async function GET() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe not configured" },
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

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get subscription record with stripe_customer_id
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, plan, billing_interval, status")
      .eq("user_id", user.id)
      .single();

    const customerId = sub?.stripe_customer_id;

    // Free user or no Stripe customer — return nulls gracefully
    if (!customerId || sub?.plan === "free" || sub?.status !== "active") {
      return NextResponse.json({
        card: null,
        nextCharge: null,
        portalUrl: null,
      });
    }

    const stripe = new Stripe(secretKey);

    // Fetch customer with expanded payment method
    const customer = await stripe.customers.retrieve(customerId, {
      expand: ["invoice_settings.default_payment_method"],
    });

    if (customer.deleted) {
      return NextResponse.json({
        card: null,
        nextCharge: null,
        portalUrl: null,
      });
    }

    // Extract default payment method (card info)
    let card: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    } | null = null;

    const defaultPm = customer.invoice_settings?.default_payment_method;
    if (defaultPm && typeof defaultPm !== "string" && defaultPm.card) {
      card = {
        brand: defaultPm.card.brand ?? "unknown",
        last4: defaultPm.card.last4 ?? "****",
        expMonth: defaultPm.card.exp_month ?? 0,
        expYear: defaultPm.card.exp_year ?? 0,
      };
    }

    // Fetch upcoming invoice for next charge info
    let nextCharge: {
      amount: string;
      date: string;
      interval: string;
    } | null = null;

    try {
      const upcoming = await stripe.invoices.createPreview({
        customer: customerId,
      });

      if (upcoming.amount_due != null && upcoming.period_end) {
        const upcomingCurrency = upcoming.currency ?? "usd";
        const amountFormatted = formatCurrencyAmount(upcoming.amount_due / 100, upcomingCurrency);
        const dateFormatted = new Date(
          upcoming.period_end * 1000
        ).toISOString();

        nextCharge = {
          amount: amountFormatted,
          date: dateFormatted,
          interval: sub.billing_interval ?? "monthly",
        };
      }
    } catch (invoiceErr) {
      // No upcoming invoice (e.g. canceled subscription) — leave null
      console.log(
        "[stripe/billing-info] No upcoming invoice:",
        invoiceErr instanceof Error ? invoiceErr.message : "unknown"
      );
    }

    // Create billing portal session URL
    let portalUrl: string | null = null;
    try {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl}/settings/subscription`,
      });
      portalUrl = portalSession.url;
    } catch (portalErr) {
      console.error(
        "[stripe/billing-info] Portal session error:",
        portalErr instanceof Error ? portalErr.message : "unknown"
      );
    }

    return NextResponse.json({ card, nextCharge, portalUrl });
  } catch (err) {
    console.error("[stripe/billing-info]", err);
    const message =
      err instanceof Error ? err.message : "Failed to fetch billing info";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
