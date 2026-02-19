"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { usePlan } from "@/contexts/plan-context";
import { formatDate } from "@/lib/i18n/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Coins, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CREDIT_PACKS: Array<{ id: string; credits: number; price: string; popular?: boolean }> = [
  { id: "20", credits: 20, price: "$2.99" },
  { id: "50", credits: 50, price: "$5.99", popular: true },
  { id: "100", credits: 100, price: "$9.99" },
];

export function CreditsSection() {
  const { t, locale } = useLanguage();
  const { planInfo, canUseAi, refetch } = usePlan();
  const searchParams = useSearchParams();

  useEffect(() => {
    const creditsSuccess = searchParams.get("credits_success");
    if (creditsSuccess === "true") {
      refetch();
      toast.success(t("credits.purchaseSuccess"));
      window.history.replaceState({}, "", "/settings/subscription");
    }
  }, [searchParams, refetch, t]);

  const handleBuyCredits = async (packId: string) => {
    try {
      const res = await fetch("/api/stripe/checkout-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else console.error("Checkout error:", data.error);
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  const hasCredits = canUseAi() && planInfo;
  const canBuy = hasCredits;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Coins className="h-5 w-5 text-violet-500" />
          <h3 className="text-lg font-semibold text-foreground">
            {t("credits.title")}
          </h3>
        </div>

        {hasCredits ? (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-500" />
                <span className="text-sm font-medium text-foreground">
                  {t("credits.remaining", {
                    count: planInfo.aiCreditsRemaining,
                    total: planInfo.aiCreditsPerMonth,
                  })}
                </span>
              </div>
              {planInfo.aiCreditsPeriodEnd && (
                <span className="text-xs text-muted-foreground">
                  {t("credits.periodEnd")}{" "}
                  {formatDate(planInfo.aiCreditsPeriodEnd, locale, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>

            {canBuy && (
              <div>
                <p className="mb-3 text-sm font-medium text-muted-foreground">
                  {t("credits.buyExtra")}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {CREDIT_PACKS.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => handleBuyCredits(pack.id)}
                      className={cn(
                        "relative flex flex-col items-center rounded-lg border p-4 transition-all hover:border-violet-500/40 hover:bg-violet-500/5",
                        pack.popular
                          ? "border-violet-500/40 bg-violet-500/5"
                          : "border-border"
                      )}
                    >
                      {pack.popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-violet-500 px-2 py-0.5 text-xs font-medium text-white">
                          {t("credits.popular")}
                        </span>
                      )}
                      <span className="text-2xl font-bold text-foreground">
                        {pack.credits}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("credits.credits")}
                      </span>
                      <span className="mt-2 text-sm font-semibold text-violet-600 dark:text-violet-400">
                        {pack.price}
                      </span>
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400">
                        {t("credits.buy")}
                        <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-muted bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">
              {t("credits.upgradeRequired")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("credits.upgradeRequiredDesc")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
