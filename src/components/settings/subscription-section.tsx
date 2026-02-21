"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { toast } from "sonner";
import { formatDate } from "@/lib/i18n/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Crown,
  Check,
  X,
  Zap,
  Star,
  Infinity,
  ArrowUpRight,
  Sparkles,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Plan Config (USD) ─── */
/* IMPORTANT: All prices are in USD. Stripe checkout is forced to en-US locale. */

type Feature = {
  nameKey: string;
  free: boolean | string;
  pro: boolean | string;
  elite: boolean | string;
};

const FEATURES: Feature[] = [
  { nameKey: "plans.features.metaApiAccounts", free: "0", pro: "5", elite: "plans.unlimited" },
  { nameKey: "plans.features.manualAccounts", free: "1", pro: "plans.unlimited", elite: "plans.unlimited" },
  { nameKey: "plans.features.importsPerMonth", free: "5", pro: "plans.unlimited", elite: "plans.unlimited" },
  { nameKey: "plans.features.dashboard", free: true, pro: true, elite: true },
  { nameKey: "plans.features.dayView", free: true, pro: true, elite: true },
  { nameKey: "plans.features.tradeView", free: true, pro: true, elite: true },
  { nameKey: "plans.features.reports", free: false, pro: true, elite: true },
  { nameKey: "plans.features.takerzScore", free: true, pro: true, elite: true },
  { nameKey: "plans.features.autoSync", free: false, pro: true, elite: true },
  { nameKey: "plans.features.economicCalendar", free: true, pro: true, elite: true },
  { nameKey: "plans.features.tags", free: "3", pro: "50", elite: "plans.unlimited" },
  { nameKey: "plans.features.aiAgents", free: false, pro: "60/mês", elite: "150/mês" },
  { nameKey: "plans.features.buyCredits", free: false, pro: true, elite: true },
  { nameKey: "plans.features.exportPdf", free: false, pro: true, elite: true },
  { nameKey: "plans.features.apiAccess", free: false, pro: false, elite: true },
  { nameKey: "plans.features.support", free: "plans.supportCommunity", pro: "plans.supportPriority", elite: "plans.supportDedicated" },
];

type PlanDef = {
  id: string;
  nameKey: string;
  priceMonthly: string;
  priceAnnual: string;
  periodKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  popular?: boolean;
};

const PLANS: PlanDef[] = [
  {
    id: "free",
    nameKey: "plans.free",
    priceMonthly: "$0",
    priceAnnual: "$0",
    periodKey: "plans.forever",
    descriptionKey: "plans.freeDesc",
    icon: Zap,
    color: "text-muted-foreground",
  },
  {
    id: "pro",
    nameKey: "plans.pro",
    priceMonthly: "$14.90",
    priceAnnual: "$149",
    periodKey: "plans.perMonth",
    descriptionKey: "plans.proDesc",
    icon: Star,
    color: "text-score",
    popular: true,
  },
  {
    id: "elite",
    nameKey: "plans.elite",
    priceMonthly: "$24.90",
    priceAnnual: "$249",
    periodKey: "plans.perYear",
    descriptionKey: "plans.eliteDesc",
    icon: Crown,
    color: "text-amber-400",
  },
];

/* ─── Feature Cell ─── */

function FeatureCell({
  value,
  t,
}: {
  value: boolean | string;
  t: (k: string) => string;
}) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-4 w-4 text-profit" />
    ) : (
      <X className="mx-auto h-4 w-4 text-muted-foreground/30" />
    );
  }
  const display = value.startsWith("plans.") ? t(value) : value;
  return (
    <span className="text-xs font-medium text-foreground">{display}</span>
  );
}

/* ─── Main Component ─── */

type Props = {
  currentPlan: string;
  memberSince: string;
};

export function SubscriptionSection({ currentPlan, memberSince }: Props) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");
  const plan = PLANS.find((p) => p.id === currentPlan) ?? PLANS[0];

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    if (success === "true") {
      toast.success(t("plans.upgradeSuccess"));
      window.history.replaceState({}, "", "/settings/subscription");
      router.refresh();
    }
    if (canceled === "true") {
      toast.info(t("plans.checkoutCanceled"));
      window.history.replaceState({}, "", "/settings/subscription");
    }
  }, [searchParams, t, router]);

  const handleUpgrade = async (planId: string) => {
    if (planId === "free") return;
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, interval: billingInterval }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else console.error("Checkout error:", data.error);
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Toggle Mensal | Anual ─── */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setBillingInterval("monthly")}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            billingInterval === "monthly"
              ? "bg-score text-white"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          {t("plans.monthly")}
        </button>
        <button
          type="button"
          onClick={() => setBillingInterval("annual")}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            billingInterval === "annual"
              ? "bg-score text-white"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          {t("plans.annual")}
        </button>
        <span className="ml-2 rounded-full bg-profit/20 px-2 py-0.5 text-xs font-medium text-profit">
          {t("plans.save17")}
        </span>
      </div>

      {/* ─── Garantia 7 dias ─── */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        {t("plans.guarantee")}
      </div>

      {/* ─── Current Plan ─── */}
      <Card className="border-score/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <plan.icon className={cn("h-6 w-6", plan.color)} />
                <h3 className="text-lg font-bold text-foreground">
                  {t("plans.plan")} {t(plan.nameKey)}
                </h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(plan.descriptionKey)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("plans.memberSince")}{" "}
                {formatDate(memberSince, locale, {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {plan.id === "free"
                  ? plan.priceMonthly
                  : billingInterval === "monthly"
                    ? plan.priceMonthly
                    : plan.priceAnnual}
              </p>
              <p className="text-xs text-muted-foreground">
                {plan.id === "free" ? t(plan.periodKey) : billingInterval === "monthly" ? t(plan.periodKey) : t("plans.perYear")}
              </p>
            </div>
          </div>

          {currentPlan === "free" && (
            <div className="mt-4 rounded-lg border border-score/20 bg-score/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-score">
                <Sparkles className="h-4 w-4" />
                {t("plans.upgradeCta")}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("plans.upgradeCtaDesc")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Plan Cards ─── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = p.id === currentPlan;
          const PlanIcon = p.icon;
          const price = p.id === "free" ? p.priceMonthly : billingInterval === "monthly" ? p.priceMonthly : p.priceAnnual;
          const period = p.id === "free" ? t(p.periodKey) : billingInterval === "monthly" ? t(p.periodKey) : t("plans.perYear");

          return (
            <Card
              key={p.id}
              className={cn(
                "relative transition-all",
                p.popular && "border-score/50 shadow-[0_0_20px_rgba(124,58,237,0.1)]",
                isCurrent && "ring-2 ring-score"
              )}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-score px-3 py-1 text-xs font-bold text-white">
                    {t("plans.popular")}
                  </span>
                </div>
              )}

              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <PlanIcon className={cn("h-5 w-5", p.color)} />
                  <h4 className="font-bold text-foreground">{t(p.nameKey)}</h4>
                </div>

                <div className="mb-2">
                  <span className="text-3xl font-bold text-foreground">
                    {price}
                  </span>
                  <span className="text-sm text-muted-foreground"> {period}</span>
                </div>

                <p className="mb-4 text-xs text-muted-foreground">
                  {t(p.descriptionKey)}
                </p>

                <ul className="mb-4 space-y-2">
                  {FEATURES.slice(0, 6).map((f) => {
                    const val = p.id === "free" ? f.free : p.id === "pro" ? f.pro : f.elite;
                    const available = typeof val === "string" || val === true;

                    return (
                      <li
                        key={f.nameKey}
                        className={cn(
                          "flex items-center gap-2 text-xs",
                          available ? "text-foreground" : "text-muted-foreground/40"
                        )}
                      >
                        {available ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-profit" />
                        ) : (
                          <X className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span>{t(f.nameKey)}</span>
                        {typeof val === "string" && (
                          <span className="ml-auto text-muted-foreground">
                            {val.startsWith("plans.") ? t(val) : val}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>

                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => handleUpgrade(p.id)}
                  className={cn(
                    "w-full rounded-lg py-2.5 text-sm font-medium transition-all",
                    isCurrent
                      ? "cursor-not-allowed bg-muted text-muted-foreground"
                      : p.popular
                        ? "bg-score text-white shadow-sm hover:bg-score/90"
                        : "border border-border text-foreground hover:bg-muted"
                  )}
                >
                  {isCurrent ? (
                    t("plans.currentPlan")
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      {t("plans.upgrade")}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Feature Comparison Table ─── */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("plans.fullComparison")}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left font-medium text-muted-foreground">
                    {t("plans.feature")}
                  </th>
                  {PLANS.map((p) => (
                    <th
                      key={p.id}
                      className={cn(
                        "pb-3 text-center font-medium",
                        p.id === currentPlan ? "text-score" : "text-muted-foreground"
                      )}
                    >
                      {t(p.nameKey)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f, i) => (
                  <tr
                    key={f.nameKey}
                    className={cn(
                      "border-b border-border/50",
                      i % 2 === 0 && "bg-muted/10"
                    )}
                  >
                    <td className="py-2.5 text-sm text-foreground">
                      {t(f.nameKey)}
                    </td>
                    <td className="py-2.5 text-center">
                      <FeatureCell value={f.free} t={t} />
                    </td>
                    <td className="py-2.5 text-center">
                      <FeatureCell value={f.pro} t={t} />
                    </td>
                    <td className="py-2.5 text-center">
                      <FeatureCell value={f.elite} t={t} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── FAQ ─── */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("plans.faq")}
          </h3>
          <div className="space-y-4">
            <FaqItem
              question={t("plans.faqCancel")}
              answer={t("plans.faqCancelAnswer")}
            />
            <FaqItem
              question={t("plans.faqDowngrade")}
              answer={t("plans.faqDowngradeAnswer")}
            />
            <FaqItem
              question={t("plans.faqPayment")}
              answer={t("plans.faqPaymentAnswer")}
            />
            <FaqItem
              question={t("plans.faqAnnual")}
              answer={t("plans.faqAnnualAnswer")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-lg bg-muted/20 p-4">
      <p className="text-sm font-medium text-foreground">{question}</p>
      <p className="mt-1 text-xs text-muted-foreground">{answer}</p>
    </div>
  );
}
