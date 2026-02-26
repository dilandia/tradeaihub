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
import { sendPaymentFailedEmail, sendPaymentConfirmationEmail, sendUpgradeConfirmedEmail, sendCancellationEmail } from "@/lib/email/send";
import { trackEvent } from "@/lib/email/events";

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

          // Idempotency: check if this credit purchase was already processed
          if (paymentIntentId) {
            const { data: existingPurchase } = await supabase
              .from("credit_purchases")
              .select("id")
              .eq("stripe_payment_intent_id", paymentIntentId)
              .maybeSingle();

            if (existingPurchase) {
              console.log("[stripe/webhook] Duplicate credit purchase skipped:", paymentIntentId);
              return NextResponse.json({ received: true, deduplicated: true });
            }
          }

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

        // Idempotency: check if this subscription period was already processed
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const firstItem = sub.items.data[0];
        const priceId = firstItem?.price.id;
        const periodStart = firstItem?.current_period_start ? new Date(firstItem.current_period_start * 1000).toISOString() : null;
        const periodEnd = firstItem?.current_period_end ? new Date(firstItem.current_period_end * 1000).toISOString() : null;

        if (periodStart) {
          const { data: existingSub } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("stripe_subscription_id", subscriptionId)
            .eq("current_period_start", periodStart)
            .maybeSingle();

          if (existingSub) {
            console.log("[stripe/webhook] Duplicate subscription checkout skipped:", subscriptionId);
            return NextResponse.json({ received: true, deduplicated: true });
          }
        }

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

        trackEvent(userId, "plan_upgraded", { plan }).catch(() => {})

        // Send payment confirmation + upgrade email
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name, locale")
            .eq("id", userId)
            .single();

          if (profile?.email) {
            const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
            const nextDate = periodEnd
              ? new Date(periodEnd).toLocaleDateString(profile.locale?.startsWith("pt") ? "pt-BR" : "en-US", { year: "numeric", month: "long", day: "numeric" })
              : "—";
            const amount = session.amount_total
              ? `$${(session.amount_total / 100).toFixed(2)}`
              : "—";

            // Fire-and-forget: don't block webhook
            sendPaymentConfirmationEmail({
              to: profile.email,
              userName: profile.full_name || undefined,
              locale: profile.locale || undefined,
              planName: planLabel,
              amountPaid: amount,
              nextBillingDate: nextDate,
              userId,
            }).catch((e) => console.error("[stripe/webhook] payment confirmation email error:", e));

            sendUpgradeConfirmedEmail({
              to: profile.email,
              userName: profile.full_name || undefined,
              locale: profile.locale || undefined,
              planName: planLabel,
              nextBillingDate: nextDate,
              userId,
            }).catch((e) => console.error("[stripe/webhook] upgrade confirmed email error:", e));
          }
        } catch (emailErr) {
          console.error("[stripe/webhook] Failed to send checkout emails:", emailErr);
        }

        // Convert referral: if this user was referred and is subscribing for the first time
        try {
          const { data: pendingRef } = await supabase
            .from("referrals")
            .select("id, referrer_id, status")
            .eq("referred_id", userId)
            .eq("status", "pending")
            .single();

          if (pendingRef) {
            const refNow = new Date().toISOString();
            await supabase
              .from("referrals")
              .update({
                status: "rewarded",
                reward_type: "credits",
                reward_amount: 20,
                converted_at: refNow,
                rewarded_at: refNow,
              })
              .eq("id", pendingRef.id);

            // Grant 20 credits to the referrer
            await supabase.rpc("add_referral_credits", {
              p_user_id: pendingRef.referrer_id,
              p_amount: 20,
            });
          }
        } catch (refErr) {
          console.error("[stripe/webhook] referral conversion failed:", refErr);
          // Non-blocking — subscription still works
        }

        // Affiliate commission: checkout.session.completed (first subscription or credit purchase)
        try {
          const paymentIntentId = typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

          const { data: affRef } = await supabase
            .from("affiliate_referrals")
            .select("id, affiliate_id, status")
            .eq("referred_user_id", userId)
            .maybeSingle();

          if (affRef) {
            const { data: affiliate } = await supabase
              .from("affiliates")
              .select("id, commission_rate, is_active")
              .eq("id", affRef.affiliate_id)
              .single();

            if (affiliate?.is_active) {
              const paymentAmount = (session.amount_total ?? 0) / 100;
              const commissionAmount = +(paymentAmount * Number(affiliate.commission_rate)).toFixed(2);
              const idempotencyKey = paymentIntentId ?? `checkout_${session.id}`;

              const { data: existingComm } = await supabase
                .from("affiliate_commissions")
                .select("id")
                .eq("idempotency_key", idempotencyKey)
                .maybeSingle();

              if (!existingComm && commissionAmount > 0) {
                await supabase.from("affiliate_commissions").insert({
                  affiliate_id: affiliate.id,
                  referral_id: affRef.id,
                  stripe_payment_intent_id: paymentIntentId ?? null,
                  payment_amount: paymentAmount,
                  commission_rate: affiliate.commission_rate,
                  commission_amount: commissionAmount,
                  idempotency_key: idempotencyKey,
                  status: "pending",
                });

                await supabase.rpc("affiliate_record_commission", {
                  p_affiliate_id: affiliate.id,
                  p_amount: commissionAmount,
                });

                // Mark referred user as converted if first time
                if (affRef.status === "registered") {
                  await supabase
                    .from("affiliate_referrals")
                    .update({ status: "converted", converted_at: new Date().toISOString() })
                    .eq("id", affRef.id);

                  // Atomically increment total_conversions via RPC
                  await supabase.rpc("affiliate_increment_conversions", {
                    p_affiliate_id: affiliate.id,
                  });
                }
              }
            }
          }
        } catch (affErr) {
          console.error("[stripe/webhook] affiliate commission (checkout) failed:", affErr);
          // Non-blocking
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

          // Send cancellation email and track event
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, full_name, locale")
              .eq("id", userId)
              .single();

            if (profile?.email) {
              const periodEnd = firstItem?.current_period_end;
              const accessEndDate = periodEnd
                ? new Date(periodEnd * 1000).toLocaleDateString(
                    profile.locale?.startsWith("pt") ? "pt-BR" : "en-US",
                    { year: "numeric", month: "long", day: "numeric" }
                  )
                : "—";

              sendCancellationEmail({
                to: profile.email,
                userName: profile.full_name || undefined,
                locale: profile.locale || undefined,
                planName: subscription.metadata?.plan || "Pro",
                accessEndDate,
                userId,
              }).catch((e) => console.error("[stripe/webhook] cancellation email error:", e));
            }

            // Track event for email lifecycle
            trackEvent(userId, "plan_cancelled").catch(() => {});
          } catch (emailErr) {
            console.error("[stripe/webhook] Failed to send cancellation email:", emailErr);
          }
        }
        break;
      }

      case "invoice.paid": {
        // Affiliate commission: recurring renewals only (subscription_cycle)
        const invoice = event.data.object as Stripe.Invoice;

        // Skip the first invoice — already handled by checkout.session.completed
        if (invoice.billing_reason === "subscription_create") break;
        if (invoice.billing_reason !== "subscription_cycle") break;

        try {
          const parentSub = invoice.parent?.subscription_details?.subscription;
          const subscriptionId = typeof parentSub === "string" ? parentSub : (parentSub as { id?: string })?.id;
          if (!subscriptionId) break;

          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = sub.metadata?.supabase_user_id;
          if (!userId) break;

          const { data: affRef } = await supabase
            .from("affiliate_referrals")
            .select("id, affiliate_id")
            .eq("referred_user_id", userId)
            .maybeSingle();

          if (!affRef) break;

          const { data: affiliate } = await supabase
            .from("affiliates")
            .select("id, commission_rate, is_active")
            .eq("id", affRef.affiliate_id)
            .single();

          if (!affiliate?.is_active) break;

          const paymentAmount = (invoice.amount_paid ?? 0) / 100;
          const commissionAmount = +(paymentAmount * Number(affiliate.commission_rate)).toFixed(2);
          const idempotencyKey = invoice.id as string;

          const { data: existingComm } = await supabase
            .from("affiliate_commissions")
            .select("id")
            .eq("idempotency_key", idempotencyKey)
            .maybeSingle();

          if (!existingComm && commissionAmount > 0) {
            await supabase.from("affiliate_commissions").insert({
              affiliate_id: affiliate.id,
              referral_id: affRef.id,
              stripe_invoice_id: invoice.id,
              payment_amount: paymentAmount,
              commission_rate: affiliate.commission_rate,
              commission_amount: commissionAmount,
              idempotency_key: idempotencyKey,
              status: "pending",
            });

            await supabase.rpc("affiliate_record_commission", {
              p_affiliate_id: affiliate.id,
              p_amount: commissionAmount,
            });
          }
        } catch (affRenewalErr) {
          console.error("[stripe/webhook] affiliate commission (renewal) failed:", affRenewalErr);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const parentSub = invoice.parent?.subscription_details?.subscription;
        const subscriptionId = typeof parentSub === "string"
          ? parentSub
          : parentSub?.id;

        if (!subscriptionId) break;

        // Look up user from subscription metadata
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = sub.metadata?.supabase_user_id;
          if (!userId) break;

          // Get user profile for email and locale
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name, locale")
            .eq("id", userId)
            .single();

          if (profile?.email) {
            await sendPaymentFailedEmail({
              to: profile.email,
              userName: profile.full_name || undefined,
              locale: profile.locale || undefined,
            });
            console.log("[stripe/webhook] Payment failed email sent to:", profile.email);
          }
        } catch (emailErr) {
          console.error("[stripe/webhook] Failed to send payment_failed email:", emailErr);
          // Non-blocking — webhook still returns 200
        }
        break;
      }

      case "charge.refunded": {
        // Reverse pending affiliate commission on refund
        const charge = event.data.object as Stripe.Charge;
        const refundPaymentIntentId = typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : (charge.payment_intent as { id?: string })?.id;

        if (!refundPaymentIntentId) break;

        try {
          const { data: commission } = await supabase
            .from("affiliate_commissions")
            .select("id, affiliate_id, commission_amount, status")
            .eq("stripe_payment_intent_id", refundPaymentIntentId)
            .eq("status", "pending")
            .maybeSingle();

          if (commission) {
            await supabase
              .from("affiliate_commissions")
              .update({ status: "refunded" })
              .eq("id", commission.id);

            await supabase.rpc("affiliate_reverse_commission", {
              p_affiliate_id: commission.affiliate_id,
              p_amount: commission.commission_amount,
            });
          }
        } catch (refundErr) {
          console.error("[stripe/webhook] affiliate refund reversal failed:", refundErr);
        }
        break;
      }

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
