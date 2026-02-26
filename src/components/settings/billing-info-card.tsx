"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";
import { formatDate } from "@/lib/i18n/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  Calendar,
  ExternalLink,
  Crown,
  Star,
  Zap,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type BillingInfo = {
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
  nextCharge: {
    amount: string;
    date: string;
    interval: string;
  } | null;
  portalUrl: string | null;
};

type Props = {
  currentPlan: string;
  memberSince: string;
};

const PLAN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  free: Zap,
  pro: Star,
  elite: Crown,
};

const PLAN_COLORS: Record<string, string> = {
  free: "text-muted-foreground",
  pro: "text-score",
  elite: "text-amber-400",
};

const PLAN_BADGE_STYLES: Record<string, string> = {
  free: "bg-muted/50 text-muted-foreground",
  pro: "bg-score/10 text-score border border-score/20",
  elite: "bg-amber-400/10 text-amber-400 border border-amber-400/20",
};

export function BillingInfoCard({ currentPlan, memberSince }: Props) {
  const { t, locale } = useLanguage();
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/stripe/billing-info");
      if (!res.ok) {
        throw new Error(`Failed to fetch billing info: ${res.status}`);
      }
      const data: BillingInfo = await res.json();
      setBillingInfo(data);
    } catch (err) {
      console.error("[BillingInfoCard]", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingInfo();
  }, [fetchBillingInfo]);

  const handleManageOnStripe = async () => {
    // If we already have a portal URL from billing-info, use it directly
    if (billingInfo?.portalUrl) {
      window.open(billingInfo.portalUrl, "_blank");
      return;
    }

    // Otherwise create a new portal session
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("[BillingInfoCard] Portal error:", err);
    }
  };

  const PlanIcon = PLAN_ICONS[currentPlan] ?? Zap;
  const planColor = PLAN_COLORS[currentPlan] ?? "text-muted-foreground";
  const badgeStyle = PLAN_BADGE_STYLES[currentPlan] ?? PLAN_BADGE_STYLES.free;
  const isFree = currentPlan === "free";

  // Card brand display name
  const formatCardBrand = (brand: string): string => {
    const brands: Record<string, string> = {
      visa: "Visa",
      mastercard: "Mastercard",
      amex: "American Express",
      discover: "Discover",
      diners: "Diners Club",
      jcb: "JCB",
      unionpay: "UnionPay",
    };
    return brands[brand.toLowerCase()] ?? brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton width="2rem" height="2rem" className="rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton width="40%" height="1.25rem" />
                <Skeleton width="25%" height="0.875rem" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton height="5rem" />
              <Skeleton height="5rem" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span>{t("billing.errorLoading")}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        {/* Plan Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full bg-muted/30",
                planColor
              )}
            >
              <PlanIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">
                  {t("billing.yourSubscription")}
                </h3>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    badgeStyle
                  )}
                >
                  {t(`plans.${currentPlan}`)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("billing.memberSince")}{" "}
                {formatDate(memberSince, locale, {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {!isFree && (
            <span className="inline-flex items-center gap-1 rounded-full bg-profit/10 px-2.5 py-1 text-xs font-medium text-profit">
              <span className="h-1.5 w-1.5 rounded-full bg-profit" />
              {t("billing.activePlan")}
            </span>
          )}
        </div>

        {/* Free Plan CTA */}
        {isFree && (
          <div className="rounded-lg border border-score/20 bg-score/5 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-score" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t("billing.freePlanMessage")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Method & Next Billing (only for paid plans) */}
        {!isFree && (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Payment Method */}
            <div className="rounded-lg border border-border/50 bg-muted/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                {t("billing.paymentMethod")}
              </div>

              {billingInfo?.card ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {formatCardBrand(billingInfo.card.brand)}{" "}
                    {t("billing.cardEnding")} {billingInfo.card.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("billing.expires")}{" "}
                    {String(billingInfo.card.expMonth).padStart(2, "0")}/
                    {billingInfo.card.expYear}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("billing.noPaymentMethod")}
                </p>
              )}

              <button
                type="button"
                onClick={handleManageOnStripe}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-score hover:text-score/80 transition-colors"
              >
                {t("billing.updateCard")}
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            {/* Next Billing */}
            <div className="rounded-lg border border-border/50 bg-muted/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {t("billing.nextBilling")}
              </div>

              {billingInfo?.nextCharge ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {t("billing.nextCharge")}: {billingInfo.nextCharge.amount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(billingInfo.nextCharge.date, locale, {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("billing.billingCycle")}:{" "}
                    {billingInfo.nextCharge.interval === "annual"
                      ? t("billing.annual")
                      : t("billing.monthly")}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("billing.noBillingScheduled")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons (paid plans only) */}
        {!isFree && (
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-1">
            <button
              type="button"
              onClick={handleManageOnStripe}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ExternalLink className="h-4 w-4" />
              {t("billing.manageOnStripe")}
            </button>
            <button
              type="button"
              onClick={handleManageOnStripe}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-loss/20 px-4 py-2 text-sm font-medium text-loss/80 transition-colors hover:bg-loss/5"
            >
              {t("billing.cancelSubscription")}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
