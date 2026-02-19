/**
 * POST /api/stripe/webhook
 * Webhook Stripe para eventos de assinatura.
 *
 * Configure no Stripe Dashboard:
 * - URL: https://seu-dominio.com/api/stripe/webhook
 * - Eventos: checkout.session.completed, customer.subscription.updated,
 *   customer.subscription.deleted, invoice.paid, invoice.payment_failed
 *
 * Variáveis de ambiente:
 * - STRIPE_SECRET_KEY
 * - STRIPE_WEBHOOK_SECRET (obtido ao criar o webhook no Dashboard)
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !webhookSecret) {
    console.error("[stripe/webhook] STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe/webhook] Signature verification failed:", msg);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        // Compra de créditos avulsos (mode=payment)
        const creditsType = session.metadata?.credits_type;
        if (creditsType === "purchase") {
          const creditsAmount = parseInt(session.metadata?.credits_amount ?? "0", 10);
          const amountUsd = parseFloat(session.metadata?.credits_amount_usd ?? "0");
          const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

          if (creditsAmount > 0) {
            const { data: existing } = await supabase
              .from("ai_credits")
              .select("credits_remaining, period_end")
              .eq("user_id", userId)
              .single();

            const now = new Date();
            const periodEnd = existing?.period_end ? new Date(existing.period_end) : null;
            const needsNewPeriod = !periodEnd || periodEnd < now;

            if (!existing || needsNewPeriod) {
              const periodStart = now;
              const end = new Date(periodStart);
              end.setMonth(end.getMonth() + 1);
              await supabase.from("ai_credits").upsert(
                {
                  user_id: userId,
                  credits_remaining: creditsAmount,
                  credits_used_this_period: 0,
                  period_start: periodStart.toISOString(),
                  period_end: end.toISOString(),
                  updated_at: now.toISOString(),
                },
                { onConflict: "user_id" }
              );
            } else {
              await supabase
                .from("ai_credits")
                .update({
                  credits_remaining: (existing.credits_remaining ?? 0) + creditsAmount,
                  updated_at: now.toISOString(),
                })
                .eq("user_id", userId);
            }

            await supabase.from("credit_purchases").insert({
              user_id: userId,
              credits_amount: creditsAmount,
              amount_paid_usd: amountUsd,
              stripe_payment_intent_id: paymentIntentId ?? null,
            });
          }
          break;
        }

        // Upgrade de plano (mode=subscription)
        const plan = session.metadata?.plan as string;
        const interval = session.metadata?.interval as string;
        if (!plan) break;

        const subscriptionId = session.subscription as string;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const firstItem = sub.items.data[0];
        const priceId = firstItem?.price.id;
        const periodStart = firstItem?.current_period_start ? new Date(firstItem.current_period_start * 1000).toISOString() : null;
        const periodEnd = firstItem?.current_period_end ? new Date(firstItem.current_period_end * 1000).toISOString() : null;

        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            plan: plan,
            billing_interval: interval ?? "monthly",
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            stripe_customer_id: session.customer as string,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            status: "active",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        const creditsPerMonth = plan === "pro" ? 60 : plan === "elite" ? 150 : 0;
        if (creditsPerMonth > 0 && periodStart && periodEnd) {
          await supabase.from("ai_credits").upsert(
            {
              user_id: userId,
              credits_remaining: creditsPerMonth,
              credits_used_this_period: 0,
              period_start: periodStart,
              period_end: periodEnd,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (!userId) break;

        const status =
          subscription.status === "active" || subscription.status === "trialing"
            ? "active"
            : subscription.status === "canceled" || subscription.status === "unpaid"
              ? "canceled"
              : "past_due";

        const plan =
          status === "active"
            ? (subscription.metadata?.plan as string) ?? "free"
            : "free";

        const firstItem = subscription.items?.data?.[0];
        const periodStart = firstItem?.current_period_start ? new Date(firstItem.current_period_start * 1000).toISOString() : null;
        const periodEnd = firstItem?.current_period_end ? new Date(firstItem.current_period_end * 1000).toISOString() : null;

        await supabase
          .from("subscriptions")
          .update({
            plan: plan,
            status,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (status !== "active") {
          await supabase
            .from("ai_credits")
            .update({ credits_remaining: 0, updated_at: new Date().toISOString() })
            .eq("user_id", userId);
        }
        break;
      }

      case "invoice.paid":
        // Opcional: renovação bem-sucedida — período já atualizado no subscription.updated
        break;

      case "invoice.payment_failed":
        // Opcional: notificar usuário ou marcar past_due
        break;

      default:
        // Ignorar outros eventos
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook]", event.type, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
