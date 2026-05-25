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
import { getPool } from "@/lib/db";
import Stripe from "stripe";
import { sendPaymentFailedEmail, sendPaymentConfirmationEmail, sendUpgradeConfirmedEmail, sendCancellationEmail } from "@/lib/email/send";
import { trackEvent } from "@/lib/email/events";
import { formatCurrencyAmount } from "@/lib/format-currency";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

  const pool = getPool();

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
            const { rows: existing } = await pool.query(
              `SELECT id FROM credit_purchases WHERE stripe_payment_intent_id = $1 LIMIT 1`,
              [paymentIntentId]
            );
            if (existing.length > 0) {
              console.log("[stripe/webhook] Duplicate credit purchase skipped:", paymentIntentId);
              return NextResponse.json({ received: true, deduplicated: true });
            }
          }

          if (creditsAmount > 0) {
            const { rows: existingRows } = await pool.query(
              `SELECT credits_remaining, period_end FROM ai_credits WHERE user_id = $1`,
              [userId]
            );
            const existing = existingRows[0] ?? null;

            const now = new Date();
            const periodEnd = existing?.period_end ? new Date(existing.period_end) : null;
            const needsNewPeriod = !periodEnd || periodEnd < now;

            if (!existing || needsNewPeriod) {
              const periodStart = now;
              const end = new Date(periodStart);
              end.setMonth(end.getMonth() + 1);
              await pool.query(
                `INSERT INTO ai_credits
                   (user_id, credits_remaining, credits_used_this_period, period_start, period_end, updated_at)
                 VALUES ($1, $2, 0, $3, $4, $5)
                 ON CONFLICT (user_id) DO UPDATE SET
                   credits_remaining = $2, credits_used_this_period = 0,
                   period_start = $3, period_end = $4, updated_at = $5`,
                [userId, creditsAmount, periodStart.toISOString(), end.toISOString(), now.toISOString()]
              );
            } else {
              await pool.query(
                `UPDATE ai_credits SET
                   credits_remaining = credits_remaining + $1, updated_at = $2
                 WHERE user_id = $3`,
                [creditsAmount, now.toISOString(), userId]
              );
            }

            try {
              await pool.query(
                `INSERT INTO credit_purchases
                   (user_id, credits_amount, amount_paid_usd, stripe_payment_intent_id)
                 VALUES ($1, $2, $3, $4)`,
                [userId, creditsAmount, amountUsd, paymentIntentId ?? null]
              );
            } catch (insertError: unknown) {
              // Handle duplicate key (UNIQUE constraint on stripe_payment_intent_id)
              if ((insertError as { code?: string })?.code === "23505") {
                console.log("[stripe/webhook] Duplicate credit purchase caught by DB constraint:", paymentIntentId);
                return NextResponse.json({ received: true, deduplicated: true });
              }
              throw insertError;
            }
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
          const { rows: existingSubRows } = await pool.query(
            `SELECT id FROM subscriptions
             WHERE stripe_subscription_id = $1 AND current_period_start = $2 LIMIT 1`,
            [subscriptionId, periodStart]
          );
          if (existingSubRows.length > 0) {
            console.log("[stripe/webhook] Duplicate subscription checkout skipped:", subscriptionId);
            return NextResponse.json({ received: true, deduplicated: true });
          }
        }

        const checkoutCurrency = session.currency ?? session.metadata?.currency ?? "usd";
        await pool.query(
          `INSERT INTO subscriptions
             (user_id, plan, billing_interval, stripe_subscription_id, stripe_price_id,
              stripe_customer_id, current_period_start, current_period_end, currency, status, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10)
           ON CONFLICT (user_id) DO UPDATE SET
             plan = $2, billing_interval = $3, stripe_subscription_id = $4,
             stripe_price_id = $5, stripe_customer_id = $6,
             current_period_start = $7, current_period_end = $8,
             currency = $9, status = 'active', updated_at = $10`,
          [
            userId, plan, interval ?? "monthly", subscriptionId, priceId,
            session.customer as string, periodStart, periodEnd,
            checkoutCurrency, new Date().toISOString(),
          ]
        );

        const creditsPerMonth = plan === "pro" ? 30 : plan === "elite" ? 60 : 0;
        if (creditsPerMonth > 0 && periodStart && periodEnd) {
          await pool.query(
            `INSERT INTO ai_credits
               (user_id, credits_remaining, credits_used_this_period, period_start, period_end, updated_at)
             VALUES ($1, $2, 0, $3, $4, $5)
             ON CONFLICT (user_id) DO UPDATE SET
               credits_remaining = $2, credits_used_this_period = 0,
               period_start = $3, period_end = $4, updated_at = $5`,
            [userId, creditsPerMonth, periodStart, periodEnd, new Date().toISOString()]
          );
        }

        trackEvent(userId, "plan_upgraded", { plan }).catch(() => {})

        // Send payment confirmation + upgrade email
        try {
          const { rows: profileRows } = await pool.query(
            `SELECT email, full_name, locale FROM profiles WHERE id = $1`,
            [userId]
          );
          const profile = profileRows[0] ?? null;

          if (profile?.email) {
            const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
            const nextDate = periodEnd
              ? new Date(periodEnd).toLocaleDateString(profile.locale?.startsWith("pt") ? "pt-BR" : "en-US", { year: "numeric", month: "long", day: "numeric" })
              : "—";
            const sessionCurrency = session.currency ?? session.metadata?.currency ?? "usd";
            const amount = session.amount_total
              ? formatCurrencyAmount(session.amount_total / 100, sessionCurrency)
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
          const { rows: refRows } = await pool.query(
            `SELECT id, referrer_id, status FROM referrals
             WHERE referred_id = $1 AND status = 'pending' LIMIT 1`,
            [userId]
          );
          const pendingRef = refRows[0] ?? null;

          if (pendingRef) {
            const refNow = new Date().toISOString();
            await pool.query(
              `UPDATE referrals SET
                 status = 'rewarded', reward_type = 'credits', reward_amount = 20,
                 converted_at = $1, rewarded_at = $1
               WHERE id = $2`,
              [refNow, pendingRef.id]
            );

            // Grant 20 credits to the referrer
            await pool.query(
              `SELECT add_referral_credits($1, $2)`,
              [pendingRef.referrer_id, 20]
            );
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

          const { rows: affRefRows } = await pool.query(
            `SELECT id, affiliate_id, status FROM affiliate_referrals
             WHERE referred_user_id = $1 LIMIT 1`,
            [userId]
          );
          const affRef = affRefRows[0] ?? null;

          if (affRef) {
            const { rows: affiliateRows } = await pool.query(
              `SELECT id, commission_rate, is_active FROM affiliates WHERE id = $1`,
              [affRef.affiliate_id]
            );
            const affiliate = affiliateRows[0] ?? null;

            if (affiliate?.is_active) {
              const paymentAmount = (session.amount_total ?? 0) / 100;
              const commissionAmount = +(paymentAmount * Number(affiliate.commission_rate)).toFixed(2);
              const idempotencyKey = paymentIntentId ?? `checkout_${session.id}`;

              const { rows: existingCommRows } = await pool.query(
                `SELECT id FROM affiliate_commissions WHERE idempotency_key = $1 LIMIT 1`,
                [idempotencyKey]
              );
              const existingComm = existingCommRows[0] ?? null;

              if (!existingComm && commissionAmount > 0) {
                const commissionCurrency = session.currency ?? session.metadata?.currency ?? "usd";
                await pool.query(
                  `INSERT INTO affiliate_commissions
                     (affiliate_id, referral_id, stripe_payment_intent_id, payment_amount,
                      commission_rate, commission_amount, currency, idempotency_key, status)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')`,
                  [
                    affiliate.id, affRef.id, paymentIntentId ?? null,
                    paymentAmount, affiliate.commission_rate, commissionAmount,
                    commissionCurrency, idempotencyKey,
                  ]
                );

                await pool.query(
                  `SELECT affiliate_record_commission($1, $2)`,
                  [affiliate.id, commissionAmount]
                );

                // Mark referred user as converted if first time
                if (affRef.status === "registered") {
                  await pool.query(
                    `UPDATE affiliate_referrals SET status = 'converted', converted_at = $1 WHERE id = $2`,
                    [new Date().toISOString(), affRef.id]
                  );

                  // Atomically increment total_conversions via RPC
                  await pool.query(
                    `SELECT affiliate_increment_conversions($1)`,
                    [affiliate.id]
                  );
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

        await pool.query(
          `UPDATE subscriptions SET
             plan = $1, status = $2, current_period_start = $3, current_period_end = $4,
             stripe_subscription_id = $5, updated_at = $6
           WHERE user_id = $7`,
          [plan, status, periodStart, periodEnd, subscription.id, new Date().toISOString(), userId]
        );

        if (status !== "active") {
          await pool.query(
            `UPDATE ai_credits SET credits_remaining = 0, updated_at = $1 WHERE user_id = $2`,
            [new Date().toISOString(), userId]
          );

          // Mark affiliate referral as churned (if user was referred)
          try {
            await pool.query(
              `UPDATE affiliate_referrals SET status = 'churned'
               WHERE referred_user_id = $1 AND status = 'converted'`,
              [userId]
            );
          } catch (churnErr) {
            console.error("[stripe/webhook] affiliate churn update failed:", churnErr);
          }

          // Send cancellation email and track event
          try {
            const { rows: profileRows } = await pool.query(
              `SELECT email, full_name, locale FROM profiles WHERE id = $1`,
              [userId]
            );
            const profile = profileRows[0] ?? null;

            if (profile?.email) {
              const rawPeriodEnd = firstItem?.current_period_end;
              const accessEndDate = rawPeriodEnd
                ? new Date(rawPeriodEnd * 1000).toLocaleDateString(
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

          const { rows: affRefRows } = await pool.query(
            `SELECT id, affiliate_id FROM affiliate_referrals
             WHERE referred_user_id = $1 LIMIT 1`,
            [userId]
          );
          const affRef = affRefRows[0] ?? null;
          if (!affRef) break;

          const { rows: affiliateRows } = await pool.query(
            `SELECT id, commission_rate, is_active FROM affiliates WHERE id = $1`,
            [affRef.affiliate_id]
          );
          const affiliate = affiliateRows[0] ?? null;
          if (!affiliate?.is_active) break;

          const paymentAmount = (invoice.amount_paid ?? 0) / 100;
          const commissionAmount = +(paymentAmount * Number(affiliate.commission_rate)).toFixed(2);
          const idempotencyKey = invoice.id as string;

          const { rows: existingCommRows } = await pool.query(
            `SELECT id FROM affiliate_commissions WHERE idempotency_key = $1 LIMIT 1`,
            [idempotencyKey]
          );
          const existingComm = existingCommRows[0] ?? null;

          if (!existingComm && commissionAmount > 0) {
            const invoiceCurrency = invoice.currency ?? "usd";
            await pool.query(
              `INSERT INTO affiliate_commissions
                 (affiliate_id, referral_id, stripe_invoice_id, payment_amount,
                  commission_rate, commission_amount, currency, idempotency_key, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')`,
              [
                affiliate.id, affRef.id, invoice.id,
                paymentAmount, affiliate.commission_rate, commissionAmount,
                invoiceCurrency, idempotencyKey,
              ]
            );

            await pool.query(
              `SELECT affiliate_record_commission($1, $2)`,
              [affiliate.id, commissionAmount]
            );
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
          const { rows: profileRows } = await pool.query(
            `SELECT email, full_name, locale FROM profiles WHERE id = $1`,
            [userId]
          );
          const profile = profileRows[0] ?? null;

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
          const { rows: commRows } = await pool.query(
            `SELECT id, affiliate_id, commission_amount, status
             FROM affiliate_commissions
             WHERE stripe_payment_intent_id = $1 AND status = 'pending' LIMIT 1`,
            [refundPaymentIntentId]
          );
          const commission = commRows[0] ?? null;

          if (commission) {
            await pool.query(
              `UPDATE affiliate_commissions SET status = 'refunded' WHERE id = $1`,
              [commission.id]
            );

            await pool.query(
              `SELECT affiliate_reverse_commission($1, $2)`,
              [commission.affiliate_id, commission.commission_amount]
            );
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
