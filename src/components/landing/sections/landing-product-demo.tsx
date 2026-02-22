"use client"

import { useMemo, useState } from "react"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import {
  FileBarChart,
  Sparkles,
  Zap,
  Check,
  ArrowRight,
} from "lucide-react"

import { useLanguage } from "@/contexts/language-context"
import { useAppUrl } from "@/contexts/app-url-context"
import { LandingSectionWrapper } from "@/components/landing/shared/landing-section-wrapper"
import { LandingSectionHeader } from "@/components/landing/shared/landing-section-header"
import { LandingGradientButton } from "@/components/landing/shared/landing-gradient-button"
import { MetricCard } from "@/components/dashboard/metric-card"
import { WinRateGauge } from "@/components/dashboard/win-rate-gauge"
import { ProfitFactorGauge } from "@/components/dashboard/profit-factor-gauge"
import { AvgWinLossBar } from "@/components/dashboard/avg-win-loss-bar"
import { DayWinRateCompact } from "@/components/dashboard/day-win-rate-compact"
import { CalendarMini } from "@/components/dashboard/calendar-mini"
import type { DayCell } from "@/lib/calendar-utils"

/* ---- Static mock data (outside component to avoid re-renders) ---- */
const MOCK_CALENDAR_DAYS: DayCell[] = [
  { date: "2025-02-01", pnl: 12, tradesCount: 3, wins: 3, losses: 0, winRate: 100 },
  { date: "2025-02-02", pnl: -5, tradesCount: 2, wins: 0, losses: 2, winRate: 0 },
  { date: "2025-02-03", pnl: 28, tradesCount: 4, wins: 4, losses: 0, winRate: 100 },
  { date: "2025-02-05", pnl: -15, tradesCount: 2, wins: 0, losses: 2, winRate: 0 },
  { date: "2025-02-06", pnl: 42, tradesCount: 5, wins: 4, losses: 1, winRate: 80 },
  { date: "2025-02-07", pnl: 8, tradesCount: 1, wins: 1, losses: 0, winRate: 100 },
  { date: "2025-02-10", pnl: 35, tradesCount: 4, wins: 3, losses: 1, winRate: 75 },
  { date: "2025-02-11", pnl: 18, tradesCount: 3, wins: 2, losses: 1, winRate: 66.7 },
  { date: "2025-02-12", pnl: -12, tradesCount: 2, wins: 0, losses: 2, winRate: 0 },
]

function buildMockCalendarData() {
  return {
    days: MOCK_CALENDAR_DAYS,
    monthPnl: MOCK_CALENDAR_DAYS.reduce((s, d) => s + d.pnl, 0),
    monthTrades: MOCK_CALENDAR_DAYS.reduce((s, d) => s + d.tradesCount, 0),
    monthTradingDays: MOCK_CALENDAR_DAYS.length,
    year: 2025,
    month: 2,
  }
}

/* ---- Animation variants ---- */
const containerVariant: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const itemVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
}

/* ---- AI Copilot Chat Mockup ---- */
function AiCopilotChat() {
  const { t } = useLanguage()
  const appUrl = useAppUrl()

  const bullets = [
    t("landing.aiCopilotBullet1"),
    t("landing.aiCopilotBullet2"),
    t("landing.aiCopilotBullet3"),
    t("landing.aiCopilotBullet4"),
  ]

  return (
    <div>
      {/* Description */}
      <div className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/15 px-4 py-1.5 text-sm font-medium text-violet-400">
          <Sparkles className="h-4 w-4" />
          {t("landing.aiCopilotSectionTitle")}
        </div>
        <h3 className="text-xl font-semibold text-white sm:text-2xl">
          {t("landing.aiCopilotSectionDesc")}
        </h3>
        <ul className="mt-4 space-y-2.5">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-center gap-2 text-gray-400">
              <Check className="h-4 w-4 shrink-0 text-profit" />
              <span className="text-sm">{bullet}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gray-500">
          {t("landing.aiCopilotPowered")}
        </p>
      </div>

      {/* Chat mockup */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-xl overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.08] bg-white/[0.02] px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 text-xs text-gray-500">
            app.tradeaihub.com/ai-copilot
          </span>
        </div>

        {/* Messages */}
        <div className="space-y-4 p-4">
          {/* User message */}
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-md border border-indigo-500/30 bg-indigo-500/20 px-4 py-2.5">
              <p className="text-sm text-white">Am I risking consistent amounts?</p>
              <p className="mt-1 text-[10px] text-gray-500">03:25 PM</p>
            </div>
          </div>

          {/* AI response */}
          <div className="flex justify-start gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
              <Zap className="h-4 w-4 text-violet-400" />
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.04] px-4 py-2.5">
              <p className="text-sm text-gray-300">
                No, you are not risking consistent amounts.
              </p>
              <p className="mt-2 text-xs font-medium text-white">
                Your Risk Amount Summary:
              </p>
              <ul className="mt-1 space-y-1 text-xs text-gray-400">
                <li>Average risk per trade: +$76.20</li>
                <li>Max Risk per Trade: +$161.22</li>
                <li>Risk Consistency Score: 38.1/100</li>
              </ul>
              <p className="mt-2 text-[10px] italic text-gray-500">
                *AI assistant, not financial advice
              </p>
              <p className="mt-1 text-[10px] text-gray-500">03:25 PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6">
        <LandingGradientButton href={`${appUrl}/register`}>
          {t("landing.aiCopilotCta")}
          <ArrowRight className="h-4 w-4" />
        </LandingGradientButton>
      </div>
    </div>
  )
}

/* ---- Product Demo Section ---- */
export function LandingProductDemo() {
  const { t } = useLanguage()
  const prefersReducedMotion = useReducedMotion()
  const [calYear, setCalYear] = useState(2025)
  const [calMonth, setCalMonth] = useState(2)
  const calendarData = useMemo(() => buildMockCalendarData(), [])

  const MotionOrDiv = prefersReducedMotion ? "div" : motion.div
  const containerProps = prefersReducedMotion
    ? {}
    : {
        variants: containerVariant,
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, amount: 0.1 },
      }
  const itemProps = prefersReducedMotion ? {} : { variants: itemVariant }

  return (
    <LandingSectionWrapper
      id="demo"
      className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <LandingSectionHeader
          label={t("landing.demoLabel")}
          title={t("landing.demoTitle")}
          subtitle={t("landing.demoSubtitle")}
        />

        <MotionOrDiv
          {...containerProps}
          className="mt-12 grid gap-12 lg:grid-cols-2"
        >
          {/* Dashboard Preview */}
          <MotionOrDiv {...itemProps}>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  {t("landing.demoDashboardLabel")}
                </span>
                <span className="rounded-full bg-profit/10 px-3 py-1 text-xs font-medium text-profit">
                  {t("landing.demoLiveBadge")}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
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

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                    setCalYear(y)
                    setCalMonth(m)
                  }}
                  onDayClick={() => {}}
                />
              </div>
            </div>
          </MotionOrDiv>

          {/* AI Copilot */}
          <MotionOrDiv {...itemProps}>
            <AiCopilotChat />
          </MotionOrDiv>
        </MotionOrDiv>
      </div>
    </LandingSectionWrapper>
  )
}
