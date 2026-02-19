"use client";

import { useLanguage } from "@/contexts/language-context";
import { LanguageSelector } from "@/components/language-selector";
import { MetricCard } from "@/components/dashboard/metric-card";
import { WinRateGauge } from "@/components/dashboard/win-rate-gauge";
import { ProfitFactorGauge } from "@/components/dashboard/profit-factor-gauge";
import { AvgWinLossBar } from "@/components/dashboard/avg-win-loss-bar";
import { DayWinRateCompact } from "@/components/dashboard/day-win-rate-compact";
import { CalendarMini } from "@/components/dashboard/calendar-mini";
import { CumulativePnlChart } from "@/components/dashboard/cumulative-pnl-chart";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Target,
  TrendingUp,
  Zap,
  ArrowRight,
  FileBarChart,
  ChevronRight,
  Clock,
  CreditCard,
  Star,
  Check,
  Upload,
  LineChart,
  BookOpen,
  Sparkles,
  Play,
  ChevronDown,
  Shield,
  MessageCircle,
} from "lucide-react";
import NextLink from "next/link";

import { APP_URL } from "@/lib/site-config";

const MOCK_PNL_DATA = [
  { date: "Jan", cumulative: 0 },
  { date: "Feb", cumulative: 15 },
  { date: "Mar", cumulative: 10 },
  { date: "Apr", cumulative: 35 },
  { date: "May", cumulative: 25 },
  { date: "Jun", cumulative: 55 },
];

const MOCK_CALENDAR_DAYS = [
  { date: "2025-02-01", pnl: 12, trades: 3 },
  { date: "2025-02-02", pnl: -5, trades: 2 },
  { date: "2025-02-03", pnl: 28, trades: 4 },
  { date: "2025-02-05", pnl: -15, trades: 2 },
  { date: "2025-02-06", pnl: 42, trades: 5 },
  { date: "2025-02-07", pnl: 8, trades: 1 },
  { date: "2025-02-10", pnl: 35, trades: 4 },
  { date: "2025-02-11", pnl: 18, trades: 3 },
  { date: "2025-02-12", pnl: -12, trades: 2 },
];

function buildMockCalendarData() {
  const days = MOCK_CALENDAR_DAYS.map((d) => {
    const wins = d.pnl >= 0 ? d.trades : 0;
    const losses = d.pnl < 0 ? d.trades : 0;
    return {
      date: d.date,
      pnl: d.pnl,
      tradesCount: d.trades,
      wins,
      losses,
      winRate: d.trades > 0 ? Math.round((wins / d.trades) * 1000) / 10 : 0,
    };
  });
  return {
    days,
    monthPnl: days.reduce((s, d) => s + d.pnl, 0),
    monthTrades: days.reduce((s, d) => s + d.tradesCount, 0),
    monthTradingDays: days.length,
    year: 2025,
    month: 2,
  };
}

export function LandingHeader() {
  const { t } = useLanguage();
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-score">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground">{t("landing.brandName")}</span>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            {t("landing.navFeatures")}
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            {t("landing.navHowItWorks")}
          </a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            {t("landing.navPricing")}
          </a>
          <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            {t("landing.navFaq")}
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <NextLink
            href={`${APP_URL}/login`}
            className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-block"
          >
            {t("landing.ctaLogin")}
          </NextLink>
          <NextLink
            href={`${APP_URL}/register`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-score px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-score/90"
          >
            {t("landing.ctaFreeTrial")}
            <ArrowRight className="h-4 w-4" />
          </NextLink>
        </div>
      </div>
    </header>
  );
}

export function LandingHero() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-score/50 bg-score/5 px-4 py-1.5 text-xs font-medium text-score">
            <Sparkles className="h-3.5 w-3.5" />
            {t("landing.heroBadge")}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            {t("landing.trustedBy")}
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl sm:leading-tight lg:text-5xl">
          {t("landing.heroTitle")}{" "}
          <span className="text-score">{t("landing.heroTitleHighlight")}</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
          {t("landing.heroSubtitle")}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <NextLink
            href={`${APP_URL}/register`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-score px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-score/90 hover:shadow-xl sm:w-auto"
          >
            {t("landing.ctaFreeTrial")}
            <ChevronRight className="h-5 w-5" />
          </NextLink>
          <NextLink
            href={`${APP_URL}/login`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-muted sm:w-auto"
          >
            <Play className="h-4 w-4" />
            {t("landing.ctaWatchDemo")}
          </NextLink>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" />
            {t("landing.noCreditCard")}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {t("landing.setupMinutes")}
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
            {t("landing.reviews")}
          </span>
        </div>
      </div>
    </section>
  );
}

export function LandingStats() {
  const { t } = useLanguage();
  const stats = [
    { value: "10K+", labelKey: "landing.statTraders", icon: BarChart3 },
    { value: "2M+", labelKey: "landing.statTrades", icon: FileBarChart },
    { value: "35%", labelKey: "landing.statImprovement", icon: TrendingUp },
    { value: "4.9/5", labelKey: "landing.statRating", icon: Star },
  ];
  return (
    <section className="border-y border-border bg-muted/30 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map(({ value, labelKey, icon: Icon }) => (
            <div key={labelKey} className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-score/10">
                <Icon className="h-6 w-6 text-score" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{t(labelKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingDashboardPreview() {
  const { t } = useLanguage();
  const [calYear, setCalYear] = useState(2025);
  const [calMonth, setCalMonth] = useState(2);
  const calendarData = useMemo(() => buildMockCalendarData(), []);

  return (
    <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-sm font-medium text-score">{t("landing.powerfulFeatures")}</p>
        <h2 className="mt-2 text-center text-3xl font-bold text-foreground sm:text-4xl">
          {t("landing.tradeSmarterTitle")}{" "}
          <span className="text-score">{t("landing.tradeSmarterHighlight")}</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          {t("landing.tradeSmarterSubtitle")}
        </p>
        <div className="mt-16 rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("landing.dashboardPreview")}</span>
            <span className="rounded-full bg-profit/10 px-3 py-1 text-xs font-medium text-profit">
              {t("landing.livePreview")}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title={t("widgets.netPnl")}
              value="+$12,450"
              subtitle={t("dashboard.tradesCount", { count: "247" })}
              icon={FileBarChart}
              trend="up"
              variant="profit"
            />
            <WinRateGauge value={68} title={t("widgets.winRate")} />
            <ProfitFactorGauge value={2.4} title={t("widgets.profitFactor")} />
            <AvgWinLossBar
              title={t("widgets.avgWinLoss")}
              avgWin={45}
              avgLoss={-28}
              format={(n) => `${Math.abs(n)} pips`}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <DayWinRateCompact
              title={t("widgets.dayWinRate")}
              winDays={18}
              lossDays={7}
              totalDays={25}
              dayWinPct={72}
              tooltip={t("widgets.dayWinRateDesc")}
            />
            <CalendarMini
              year={calYear}
              month={calMonth}
              days={calendarData.days}
              monthPnl={calendarData.monthPnl}
              monthTrades={calendarData.monthTrades}
              monthTradingDays={calendarData.monthTradingDays}
              privacy={false}
              unit="pips"
              onMonthChange={(y, m) => {
                setCalYear(y);
                setCalMonth(m);
              }}
              onDayClick={() => {}}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingProcess() {
  const { t } = useLanguage();
  const steps = [
    { num: "01", titleKey: "landing.step1Title", descKey: "landing.step1Desc", icon: Upload },
    { num: "02", titleKey: "landing.step2Title", descKey: "landing.step2Desc", icon: LineChart },
    { num: "03", titleKey: "landing.step3Title", descKey: "landing.step3Desc", icon: BookOpen },
    { num: "04", titleKey: "landing.step4Title", descKey: "landing.step4Desc", icon: Sparkles },
  ];
  return (
    <section id="how-it-works" className="border-t border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
          {t("landing.processTitle")}{" "}
          <span className="text-score">{t("landing.processTitleHighlight")}</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          {t("landing.processSubtitle")}
        </p>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ num, titleKey, descKey, icon: Icon }) => (
            <div key={num} className="relative">
              <div className="rounded-2xl border border-border bg-card p-6">
                <span className="text-5xl font-bold text-score/20">{num}</span>
                <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-score/10">
                  <Icon className="h-5 w-5 text-score" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{t(titleKey)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(descKey)}</p>
              </div>
              {num !== "04" && (
                <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-muted-foreground lg:block">
                  <ChevronRight className="h-6 w-6" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingTrackAnalyze() {
  const { t } = useLanguage();

  return (
    <section className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 inline-flex rounded-full bg-score/10 px-4 py-1.5 text-sm font-medium text-score">
          {t("landing.builtFor")}
        </div>
        <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
          {t("landing.trackTitle")}{" "}
          <span className="text-score">{t("landing.trackHighlight")}</span>
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          {t("landing.trackSubtitle")}
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
          <div className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-score/30 hover:shadow-lg hover:shadow-score/5">
            <h3 className="font-semibold text-foreground">{t("landing.widgetReports")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("landing.widgetReportsDesc")}</p>
            <div className="mt-4">
              <CumulativePnlChart
                data={MOCK_PNL_DATA}
                compact
                privacy={false}
                unit="pips"
              />
            </div>
          </div>
          <div className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-score/30 hover:shadow-lg hover:shadow-score/5">
            <h3 className="font-semibold text-foreground">{t("landing.widgetStats")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("landing.widgetStatsDesc")}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <WinRateGauge value={67} title={t("widgets.winRate")} />
              <ProfitFactorGauge value={2.1} title={t("widgets.profitFactor")} />
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {["landing.statPnl", "landing.statWinRate", "landing.statCalendar", "landing.statSetup"].map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-profit" />
                  {t(k)}
                </li>
              ))}
            </ul>
          </div>
          <div className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-score/30 hover:shadow-lg hover:shadow-score/5">
            <h3 className="font-semibold text-foreground">{t("landing.valueTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("landing.valueSubtitle")}</p>
            <div className="mt-6 space-y-4">
              <div className="flex gap-4 rounded-xl border border-border bg-muted/30 p-4">
                <Target className="h-10 w-10 shrink-0 text-loss" />
                <div>
                  <h4 className="font-medium text-foreground">{t("landing.traderLosing")}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{t("landing.traderLosingDesc")}</p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-border bg-muted/30 p-4">
                <TrendingUp className="h-10 w-10 shrink-0 text-profit" />
                <div>
                  <h4 className="font-medium text-foreground">{t("landing.traderWinning")}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{t("landing.traderWinningDesc")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center">
          <NextLink
            href="#features"
            className="inline-flex items-center gap-2 text-sm font-medium text-score hover:text-score/80"
          >
            {t("landing.seeAllFeatures")}
            <ArrowRight className="h-4 w-4" />
          </NextLink>
        </div>
      </div>
    </section>
  );
}

export function LandingSegments() {
  const { t } = useLanguage();
  const segments = [
    { key: "dayTraders", icon: Clock },
    { key: "swingTraders", icon: LineChart },
    { key: "cryptoTraders", icon: BarChart3 },
    { key: "forexTraders", icon: TrendingUp },
  ];
  return (
    <section className="border-t border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
          {t("landing.segmentsTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          {t("landing.segmentsSubtitle")}
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {segments.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-score/10">
                <Icon className="h-6 w-6 text-score" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{t(`landing.${key}`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(`landing.${key}Desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingTestimonials() {
  const { t } = useLanguage();
  const testimonials = [
    { quoteKey: "landing.testimonial1", authorKey: "landing.testimonial1Author", roleKey: "landing.testimonial1Role" },
    { quoteKey: "landing.testimonial2", authorKey: "landing.testimonial2Author", roleKey: "landing.testimonial2Role" },
    { quoteKey: "landing.testimonial3", authorKey: "landing.testimonial3Author", roleKey: "landing.testimonial3Role" },
  ];
  return (
    <section className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
          {t("landing.testimonialsTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          {t("landing.testimonialsSubtitle")}
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map(({ quoteKey, authorKey, roleKey }) => (
            <div key={quoteKey} className="rounded-2xl border border-border bg-card p-6">
              <p className="text-muted-foreground">&ldquo;{t(quoteKey)}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-score/10">
                  <MessageCircle className="h-5 w-5 text-score" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t(authorKey)}</p>
                  <p className="text-sm text-muted-foreground">{t(roleKey)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingPricing() {
  const { t } = useLanguage();
  return (
    <section id="pricing" className="border-t border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
          {t("landing.pricingTitle")}{" "}
          <span className="text-score">{t("landing.pricingTitleHighlight")}</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          {t("landing.pricingSubtitle")}
        </p>
        <p className="mt-2 text-center text-sm font-medium text-profit">{t("landing.pricingGuarantee")}</p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <h3 className="font-semibold text-foreground">{t("landing.planFree")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("landing.planFreeDesc")}</p>
            <p className="mt-4 text-3xl font-bold text-foreground">{t("landing.planFreePrice")}</p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {["landing.planFree1", "landing.planFree2", "landing.planFree3"].map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-profit" />
                  {t(k)}
                </li>
              ))}
            </ul>
            <NextLink
              href={`${APP_URL}/register`}
              className="mt-8 block w-full rounded-xl border border-border py-3 text-center font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t("landing.ctaGetStarted")}
            </NextLink>
          </div>
          <div className="relative rounded-2xl border-2 border-score bg-card p-8 shadow-lg">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-score px-4 py-1 text-xs font-semibold text-white">
              {t("landing.mostPopular")}
            </span>
            <h3 className="font-semibold text-foreground">{t("landing.planPro")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("landing.planProDesc")}</p>
            <p className="mt-4 text-3xl font-bold text-foreground">{t("landing.planProPrice")}</p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {["landing.planPro1", "landing.planPro2", "landing.planPro3", "landing.planPro4"].map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-profit" />
                  {t(k)}
                </li>
              ))}
            </ul>
            <NextLink
              href={`${APP_URL}/register`}
              className="mt-8 block w-full rounded-xl bg-score py-3 text-center font-semibold text-white transition-colors hover:bg-score/90"
            >
              {t("landing.ctaFreeTrial")}
            </NextLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFaq() {
  const { t } = useLanguage();
  const faqs = [
    { q: "landing.faq1Q", a: "landing.faq1A" },
    { q: "landing.faq2Q", a: "landing.faq2A" },
    { q: "landing.faq3Q", a: "landing.faq3A" },
    { q: "landing.faq4Q", a: "landing.faq4A" },
    { q: "landing.faq5Q", a: "landing.faq5A" },
  ];
  return (
    <section id="faq" className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
          {t("landing.faqTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
          {t("landing.faqSubtitle")}
        </p>
        <div className="mt-12 space-y-4">
          {faqs.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-xl border border-border bg-card [&_summary]:cursor-pointer"
            >
              <summary className="flex items-center justify-between p-4 font-medium text-foreground">
                {t(q)}
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-border p-4 text-sm text-muted-foreground">
                {t(a)}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingCta() {
  const { t } = useLanguage();
  return (
    <section className="border-t border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 text-center shadow-lg sm:p-12">
        <p className="text-sm font-medium text-score">{t("landing.ctaBanner")}</p>
        <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
          {t("landing.ctaTitle")}
        </h2>
        <p className="mt-4 text-muted-foreground">
          {t("landing.ctaSubtitle")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t("landing.ctaBenefit1")}
          </span>
          <span className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            {t("landing.ctaBenefit2")}
          </span>
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t("landing.ctaBenefit3")}
          </span>
        </div>
        <NextLink
          href={`${APP_URL}/register`}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-score px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-score/90"
        >
          {t("landing.ctaFreeTrial")}
          <ArrowRight className="h-5 w-5" />
        </NextLink>
        <p className="mt-4 text-xs text-muted-foreground">{t("landing.ctaSocialProof")}</p>
      </div>
    </section>
  );
}

export function LandingFooter() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-border bg-muted/30 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-score">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-foreground">{t("landing.brandName")}</span>
            </div>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">{t("landing.footerTagline")}</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-4">
            <div>
              <h4 className="font-semibold text-foreground">{t("landing.footerProduct")}</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">{t("landing.navFeatures")}</a></li>
                <li><a href="#pricing" className="hover:text-foreground">{t("landing.navPricing")}</a></li>
                <li><NextLink href={`${APP_URL}/login`} className="hover:text-foreground">{t("landing.ctaLogin")}</NextLink></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">{t("landing.footerCompany")}</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">{t("landing.footerAbout")}</a></li>
                <li><a href="#" className="hover:text-foreground">{t("landing.footerContact")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">{t("landing.footerLegal")}</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">{t("landing.footerPrivacy")}</a></li>
                <li><a href="#" className="hover:text-foreground">{t("landing.footerTerms")}</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t("landing.brandName")}. {t("landing.footerRights")}
          </span>
          <span className="text-sm text-muted-foreground">{t("landing.footerMadeWith")}</span>
        </div>
      </div>
    </footer>
  );
}
