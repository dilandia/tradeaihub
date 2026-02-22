"use client"

import { motion, useReducedMotion, type Variants } from "framer-motion"
import { Check, Target, Shield, Tags } from "lucide-react"

import { useLanguage } from "@/contexts/language-context"
import { LandingSectionWrapper } from "@/components/landing/shared/landing-section-wrapper"
import { LandingSectionHeader } from "@/components/landing/shared/landing-section-header"
import { LandingGlassCard } from "@/components/landing/shared/landing-glass-card"

/* ---- Static feature data (outside component) ---- */
const FEATURES = [
  {
    icon: Target,
    badgeKey: "landing.advFeature1Title",
    titleKey: "landing.advFeature1Title",
    descKey: "landing.advFeature1Desc",
    bullets: [
      "landing.advFeature1Bullet1",
      "landing.advFeature1Bullet2",
      "landing.advFeature1Bullet3",
    ],
  },
  {
    icon: Shield,
    badgeKey: "landing.advFeature2Title",
    titleKey: "landing.advFeature2Title",
    descKey: "landing.advFeature2Desc",
    bullets: [
      "landing.advFeature2Bullet1",
      "landing.advFeature2Bullet2",
      "landing.advFeature2Bullet3",
    ],
  },
  {
    icon: Tags,
    badgeKey: "landing.advFeature3Title",
    titleKey: "landing.advFeature3Title",
    descKey: "landing.advFeature3Desc",
    bullets: [
      "landing.advFeature3Bullet1",
      "landing.advFeature3Bullet2",
      "landing.advFeature3Bullet3",
    ],
  },
] as const

/* ---- TakeZ Score Mockup (SVG gauge) ---- */
function ScoreMockup() {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const score = 84
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] p-8">
      <svg width="160" height="160" viewBox="0 0 160 160" aria-label={`TakeZ Score: ${score}`}>
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 80 80)"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <text
          x="80"
          y="75"
          textAnchor="middle"
          className="fill-white text-3xl font-bold"
          fontSize="32"
        >
          {score}
        </text>
        <text
          x="80"
          y="100"
          textAnchor="middle"
          className="fill-gray-500 text-xs"
          fontSize="12"
        >
          TakeZ Score
        </text>
      </svg>
    </div>
  )
}

/* ---- Risk Dashboard Mockup ---- */
function RiskMockup() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
      <p className="text-xs uppercase tracking-wider text-gray-500">Risk Overview</p>
      <div className="mt-4 space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Max Drawdown</span>
            <span className="font-medium text-loss">-8.3%</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-white/[0.06]">
            <div className="h-2 w-[33%] rounded-full bg-gradient-to-r from-loss to-loss/60" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">R:R Ratio</span>
            <span className="font-medium text-profit">2.4:1</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-white/[0.06]">
            <div className="h-2 w-[80%] rounded-full bg-gradient-to-r from-profit to-profit/60" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Risk per Trade</span>
            <span className="font-medium text-white">1.2%</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-white/[0.06]">
            <div className="h-2 w-[48%] rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- Strategy Cards Mockup ---- */
function StrategyMockup() {
  const strategies = [
    { name: "Breakout", winRate: 72, trades: 48 },
    { name: "Pullback", winRate: 65, trades: 31 },
    { name: "Range", winRate: 58, trades: 22 },
  ]

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
      <p className="text-xs uppercase tracking-wider text-gray-500">Strategy Performance</p>
      <div className="mt-4 space-y-3">
        {strategies.map((s) => (
          <div
            key={s.name}
            className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-white">{s.name}</p>
              <p className="text-xs text-gray-500">{s.trades} trades</p>
            </div>
            <span
              className={`text-sm font-semibold ${s.winRate >= 65 ? "text-profit" : "text-gray-400"}`}
            >
              {s.winRate}% WR
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---- Mockup components map ---- */
const MOCKUPS = [ScoreMockup, RiskMockup, StrategyMockup] as const

/* ---- Animation variants ---- */
const containerVariant: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
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

/* ---- Advanced Features Section ---- */
export function LandingFeaturesAdv() {
  const { t } = useLanguage()
  const prefersReducedMotion = useReducedMotion()

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
      id="advanced"
      className="bg-muted/30 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <LandingSectionHeader
          label={t("landing.advFeaturesLabel")}
          title={t("landing.featuresTitle")}
          subtitle={t("landing.featuresSubtitle")}
        />

        <MotionOrDiv {...containerProps} className="mt-12 space-y-16 lg:space-y-24">
          {FEATURES.map((feature, idx) => {
            const MockupComponent = MOCKUPS[idx]
            const isReversed = idx % 2 !== 0

            return (
              <MotionOrDiv
                key={feature.titleKey}
                {...itemProps}
                className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${
                  isReversed ? "lg:[direction:rtl]" : ""
                }`}
              >
                {/* Visual mockup */}
                <div className={isReversed ? "lg:[direction:ltr]" : ""}>
                  <LandingGlassCard className="p-2">
                    <MockupComponent />
                  </LandingGlassCard>
                </div>

                {/* Text content */}
                <div className={isReversed ? "lg:[direction:ltr]" : ""}>
                  <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
                    <feature.icon className="h-3.5 w-3.5" />
                    {t(feature.badgeKey)}
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-white">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-gray-400">
                    {t(feature.descKey)}
                  </p>
                  <ul className="mt-4 space-y-2.5">
                    {feature.bullets.map((bulletKey) => (
                      <li
                        key={bulletKey}
                        className="flex items-center gap-2 text-sm text-gray-400"
                      >
                        <Check className="h-4 w-4 shrink-0 text-profit" />
                        {t(bulletKey)}
                      </li>
                    ))}
                  </ul>
                </div>
              </MotionOrDiv>
            )
          })}
        </MotionOrDiv>
      </div>
    </LandingSectionWrapper>
  )
}
