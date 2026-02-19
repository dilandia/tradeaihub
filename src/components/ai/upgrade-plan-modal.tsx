"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import {
  Sparkles,
  ArrowRight,
  X,
  Crown,
  Zap,
  RefreshCw,
  Shield,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  message: string;
  /** "plan" = precisa upgrade; "credits" = precisa comprar créditos */
  variant?: "plan" | "credits";
};

const PLAN_FEATURES = [
  { key: "upgradeModal.feature1", icon: Sparkles },
  { key: "upgradeModal.feature2", icon: BarChart3 },
  { key: "upgradeModal.feature3", icon: RefreshCw },
  { key: "upgradeModal.feature4", icon: Zap },
] as const;

const CREDITS_FEATURES = [
  { key: "creditsModal.feature1", icon: Zap },
  { key: "creditsModal.feature2", icon: Shield },
] as const;

const REASSURANCE = [
  { key: "upgradeModal.guarantee", icon: RefreshCw },
  { key: "upgradeModal.cancelAnytime", icon: Shield },
  { key: "upgradeModal.securePayment", icon: Shield },
] as const;

export function UpgradePlanModal({ open, onClose, message, variant = "plan" }: Props) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted || typeof document === "undefined") return null;

  const isCredits = variant === "credits";
  const features = isCredits ? CREDITS_FEATURES : PLAN_FEATURES;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      {/* Overlay fixo em tela inteira — blur tipo vidro, transparência leve */}
      <div
        className="fixed inset-0 z-[9998] bg-white/20 dark:bg-black/25 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal — cores do tema (bg-card, text-foreground) */}
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-[9999] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border m-4",
          "bg-card text-foreground shadow-2xl shadow-black/20",
          "ring-1 ring-border"
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105 transition-all duration-200"
          aria-label={t("common.close")}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          {/* Ícone com coroa */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-score/15 ring-1 ring-score/30">
                <Sparkles className="h-8 w-8 text-score" />
              </div>
              <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white">
                <Crown className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Subheading */}
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-score">
            {isCredits ? t("creditsModal.subheading") : t("upgradeModal.subheading")}
          </p>

          {/* Título principal */}
          <h2
            id="upgrade-modal-title"
            className="mt-2 text-center text-2xl font-bold text-foreground"
          >
            {isCredits ? t("creditsModal.heading") : t("upgradeModal.heading")}
          </h2>

          {/* Descrição */}
          <p className="mt-3 text-center text-sm text-muted-foreground">
            {isCredits ? t("creditsModal.description") : t("upgradeModal.description")}
          </p>

          {/* Lista de features */}
          <ul className="mt-6 space-y-3">
            {features.map(({ key, icon: Icon }) => (
              <li
                key={key}
                className="flex items-center gap-3 text-sm text-foreground"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-score/10 text-score">
                  <Icon className="h-4 w-4" />
                </div>
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/settings/subscription"
              onClick={onClose}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5",
                "bg-score font-semibold text-amber-400",
                "hover:bg-score/90 hover:scale-[1.02] hover:shadow-xl hover:shadow-score/30",
                "transition-all duration-200 shadow-lg shadow-score/25"
              )}
            >
              <Crown className="h-5 w-5" />
              {isCredits ? t("creditsModal.upgradeCta") : t("upgradeModal.upgradeCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {!isCredits && (
              <Link
                href="/settings/subscription"
                onClick={onClose}
                className="text-center text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors duration-200"
              >
                {t("upgradeModal.comparePlans")}
              </Link>
            )}
          </div>

          {/* Footer de garantias */}
          {!isCredits && (
            <div className="mt-8 flex flex-wrap justify-center gap-4 border-t border-border pt-6">
              {REASSURANCE.map(({ key, icon: Icon }) => (
                <div
                  key={key}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{t(key)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
