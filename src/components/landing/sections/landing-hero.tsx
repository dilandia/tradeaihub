"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Sparkles, CreditCard, Clock, Star, ArrowRight, TrendingUp } from "lucide-react"
import NextLink from "next/link"

import { useLanguage } from "@/contexts/language-context"
import { useAppUrl } from "@/contexts/app-url-context"
import { LandingGradientButton } from "@/components/landing/shared/landing-gradient-button"
import { LandingGhostButton } from "@/components/landing/shared/landing-ghost-button"

/* ---- Static mock data (outside component to avoid re-renders) ---- */
const MOCK_BARS = [35, 52, 28, 65, 48, 72, 60, 45, 80, 55, 68, 42] as const

const TRUST_BADGES = [
  { icon: CreditCard, key: "landing.trustNoCreditCard" },
  { icon: Clock, key: "landing.trustSetup" },
  { icon: Star, key: "landing.trustRating" },
] as const

/* ---- Animation variants ---- */
const fadeUp = (delay: number) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const, delay },
  },
})

const mockupVariant = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" as const, delay: 0.6 },
  },
}

/* ---- Mock Dashboard Card (adapted from orphaned landing-hero.tsx) ---- */
function MockDashboardCard() {
  return (
    <div className="relative mx-auto mt-12 max-w-2xl lg:mt-16">
      <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-violet-500/10 to-indigo-500/20 blur-xl" />
      <div className="relative rounded-xl border border-white/10 bg-[#12121f]/90 p-6 backdrop-blur-sm">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Portfolio Performance
            </p>
            <p className="mt-1 text-2xl font-bold text-white">+$4,832.50</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">+12.4%</span>
          </div>
        </div>

        {/* Chart bars */}
        <div className="flex h-28 items-end gap-1.5">
          {MOCK_BARS.map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all"
              style={{
                height: `${height}%`,
                background:
                  height > 50
                    ? "linear-gradient(to top, #10b981, #10b98180)"
                    : "linear-gradient(to top, #6366f1, #6366f180)",
              }}
            />
          ))}
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
          <div>
            <p className="text-xs text-gray-500">Win Rate</p>
            <p className="text-sm font-semibold text-white">67.8%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Profit Factor</p>
            <p className="text-sm font-semibold text-white">2.14</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">TakeZ Score</p>
            <p className="text-sm font-semibold text-indigo-400">84</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- Hero Section ---- */
export function LandingHero() {
  const { t } = useLanguage()
  const appUrl = useAppUrl()
  const prefersReducedMotion = useReducedMotion()

  const MotionOrDiv = prefersReducedMotion ? "div" : motion.div

  const motionProps = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          variants: fadeUp(delay),
          initial: "hidden" as const,
          animate: "visible" as const,
        }

  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-[#121212] px-4 pt-32 pb-20 sm:px-6 sm:pt-40 sm:pb-28 lg:px-8">
      {/* Radial glow overlay */}
      <div
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.12), rgba(139,92,246,0.06) 40%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Badge */}
        <MotionOrDiv {...motionProps(0)}>
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            {t("landing.heroBadge")}
          </span>
        </MotionOrDiv>

        {/* Headline */}
        <MotionOrDiv {...motionProps(0.1)}>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("landing.heroTitle")}
          </h1>
        </MotionOrDiv>

        {/* Subtitle */}
        <MotionOrDiv {...motionProps(0.2)}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 leading-relaxed sm:text-xl">
            {t("landing.heroSubtitle")}
          </p>
        </MotionOrDiv>

        {/* CTAs */}
        <MotionOrDiv
          {...motionProps(0.3)}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <LandingGradientButton href={`${appUrl}/register`} size="lg">
            {t("landing.ctaStartJournal")}
            <ArrowRight className="h-5 w-5" />
          </LandingGradientButton>
          <LandingGhostButton href="#demo" size="lg">
            {t("landing.ctaSeeHow")}
          </LandingGhostButton>
        </MotionOrDiv>

        {/* Trust badges */}
        <MotionOrDiv
          {...motionProps(0.4)}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400"
        >
          {TRUST_BADGES.map(({ icon: Icon, key }) => (
            <span key={key} className="flex items-center gap-1.5">
              <Icon className="h-4 w-4" />
              {t(key)}
            </span>
          ))}
        </MotionOrDiv>

        {/* Product mockup */}
        {prefersReducedMotion ? (
          <MockDashboardCard />
        ) : (
          <motion.div
            variants={mockupVariant}
            initial="hidden"
            animate="visible"
          >
            <MockDashboardCard />
          </motion.div>
        )}
      </div>
    </section>
  )
}
