"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSelector } from "@/components/language-selector";
import { BarChart3, Shield, Zap, Target } from "lucide-react";

const APP_URL = "https://app.tradeaihub.com";

export function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="text-xl font-bold text-foreground">{t("common.appName")}</span>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Link
              href={`${APP_URL}/login`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t("auth.login")}
            </Link>
            <Link
              href={`${APP_URL}/register`}
              className="rounded-lg bg-score px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-score/90"
            >
              {t("auth.signUp")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
          {t("landing.heroTitle")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          {t("landing.heroDesc")}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={`${APP_URL}/register`}
            className="inline-flex items-center gap-2 rounded-xl bg-score px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-score/90 hover:shadow-score/25"
          >
            {t("landing.ctaStart")}
          </Link>
          <Link
            href={`${APP_URL}/login`}
            className="inline-flex items-center rounded-xl border border-border px-8 py-4 text-base font-medium text-foreground transition-colors hover:bg-muted"
          >
            {t("auth.login")}
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-border bg-card/50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-foreground">
            {t("landing.benefitsTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            {t("landing.benefitsDesc")}
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <BenefitCard
              icon={BarChart3}
              title={t("landing.benefit1Title")}
              desc={t("landing.benefit1Desc")}
            />
            <BenefitCard
              icon={Target}
              title={t("landing.benefit2Title")}
              desc={t("landing.benefit2Desc")}
            />
            <BenefitCard
              icon={Zap}
              title={t("landing.benefit3Title")}
              desc={t("landing.benefit3Desc")}
            />
            <BenefitCard
              icon={Shield}
              title={t("landing.benefit4Title")}
              desc={t("landing.benefit4Desc")}
            />
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground">
            {t("landing.ctaTitle")}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t("landing.ctaDesc")}
          </p>
          <Link
            href={`${APP_URL}/register`}
            className="mt-8 inline-flex rounded-xl bg-score px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-score/90"
          >
            {t("landing.ctaStart")}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {t("common.appName")}. {t("landing.footerRights")}
        </div>
      </footer>
    </div>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 inline-flex rounded-lg bg-score/10 p-3">
        <Icon className="h-6 w-6 text-score" />
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
