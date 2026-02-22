"use client";

import { useState } from "react";
import {
  Gift,
  Copy,
  Check,
  Users,
  TrendingUp,
  Sparkles,
  UserPlus,
  CreditCard,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import type { ReferralStats, ReferralHistoryItem } from "@/app/actions/referrals";

type Props = {
  referralCode: string;
  stats: ReferralStats;
  history: ReferralHistoryItem[];
};

const REFERRAL_BASE_URL = "https://tradeaihub.com/register?ref=";

export function ReferralsPageContent({ referralCode, stats, history }: Props) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const referralLink = `${REFERRAL_BASE_URL}${referralCode}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleShareTwitter() {
    const text = encodeURIComponent(
      t("referrals.twitterShareText") ||
        "I'm using Trade AI Hub to track and improve my trading. Join me and get bonus AI credits!"
    );
    const url = encodeURIComponent(referralLink);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank"
    );
  }

  function handleShareWhatsApp() {
    const text = encodeURIComponent(
      `${t("referrals.whatsappShareText") || "Check out Trade AI Hub! Sign up with my link and get bonus AI credits:"} ${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Hero */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-amber-500/20">
          <Gift className="h-8 w-8 text-violet-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          {t("referrals.title")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("referrals.subtitle")}
        </p>
      </div>

      {/* Referral Link Card */}
      <Card className="border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-amber-500/5">
        <CardHeader>
          <CardTitle>{t("referrals.yourLink")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 truncate rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm text-foreground">
              {referralLink}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border transition-colors",
                copied
                  ? "border-green-500/50 bg-green-500/10 text-green-500"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-label={t("referrals.copyLink")}
            >
              {copied ? (
                <Check className="h-5 w-5" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-sm font-medium text-green-500">
              {t("referrals.copied")}
            </p>
          )}
          {/* Share buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Copy className="h-4 w-4" />
              {t("referrals.copyLink")}
            </button>
            <button
              type="button"
              onClick={handleShareTwitter}
              className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80 dark:bg-white dark:text-black"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              {t("referrals.shareTwitter")}
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {t("referrals.shareWhatsapp")}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
            <Users className="h-6 w-6 text-muted-foreground" />
            <p className="text-2xl font-bold text-foreground">{stats.totalReferrals}</p>
            <p className="text-xs text-muted-foreground">
              {t("referrals.statsTotal")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
            <TrendingUp className="h-6 w-6 text-blue-500" />
            <p className="text-2xl font-bold text-foreground">{stats.converted}</p>
            <p className="text-xs text-muted-foreground">
              {t("referrals.statsConverted")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
            <UserPlus className="h-6 w-6 text-amber-500" />
            <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">
              {t("referrals.statsPending")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
            <Sparkles className="h-6 w-6 text-violet-500" />
            <p className="text-2xl font-bold text-foreground">{stats.creditsEarned}</p>
            <p className="text-xs text-muted-foreground">
              {t("referrals.statsCredits")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>{t("referrals.howItWorks")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10 text-violet-500">
                <Copy className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{t("referrals.step1Title")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("referrals.step1")}</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{t("referrals.step2Title")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("referrals.step2")}</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{t("referrals.step3Title")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("referrals.step3")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reward Info */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="flex items-start gap-4 py-4">
          <CreditCard className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold text-foreground">{t("referrals.reward")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("referrals.rewardDesc")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>{t("referrals.historyTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("referrals.historyEmpty")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">{t("referrals.historyUser")}</th>
                    <th className="pb-3 pr-4 font-medium">{t("referrals.historyDate")}</th>
                    <th className="pb-3 pr-4 font-medium">{t("referrals.historyStatus")}</th>
                    <th className="pb-3 font-medium">{t("referrals.historyReward")}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium text-foreground">{item.referredName}</p>
                          <p className="text-xs text-muted-foreground">{item.referredEmail}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3 text-foreground">
                        {item.rewardAmount
                          ? `+${item.rewardAmount} ${t("referrals.credits")}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "pending" | "converted" | "rewarded" }) {
  const { t } = useLanguage();

  const styles: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    converted: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    rewarded: "bg-green-500/15 text-green-600 dark:text-green-400",
  };

  const labels: Record<string, string> = {
    pending: t("referrals.statusPending"),
    converted: t("referrals.statusConverted"),
    rewarded: t("referrals.statusRewarded"),
  };

  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-1 text-xs font-medium",
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}
