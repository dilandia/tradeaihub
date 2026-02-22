"use client"

import { useState } from "react"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import { Check, Shield } from "lucide-react"

import { useLanguage } from "@/contexts/language-context"
import { useAppUrl } from "@/contexts/app-url-context"
import { LandingSectionWrapper } from "@/components/landing/shared/landing-section-wrapper"
import { LandingSectionHeader } from "@/components/landing/shared/landing-section-header"
import { LandingGlassCard } from "@/components/landing/shared/landing-glass-card"
import { LandingGradientButton } from "@/components/landing/shared/landing-gradient-button"
import { LandingGhostButton } from "@/components/landing/shared/landing-ghost-button"

/* ---- Types ---- */
type BillingCycle = "monthly" | "annual"

/* ---- Static data ---- */
const FREE_FEATURES = [
  "landing.planFree1",
  "landing.planFree2",
  "landing.planFree3",
] as const

const PRO_FEATURES = [
  "landing.planPro1",
  "landing.planPro2",
  "landing.planPro3",
  "landing.planPro4",
  "landing.planPro5",
  "landing.planPro6",
] as const

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

/* ---- Pricing Section ---- */
export function LandingPricing() {
  const { t } = useLanguage()
  const appUrl = useAppUrl()
  const prefersReducedMotion = useReducedMotion()
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")

  const isAnnual = billingCycle === "annual"
  const registerUrl = `${appUrl}/register`

  const pricingCards = (
    <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
      {/* Free Tier */}
      <LandingGlassCard className="flex flex-col p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-white">
          {t("landing.planFree")}
        </h3>
        <p className="mt-1 text-sm text-gray-400">
          {t("landing.planFreeDesc")}
        </p>
        <p className="mt-4 text-4xl font-bold text-white">
          {t("landing.planFreePrice")}
        </p>

        <ul className="mt-6 flex-1 space-y-3">
          {FREE_FEATURES.map((key) => (
            <li key={key} className="flex items-center gap-2 text-sm text-gray-300">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
              {t(key)}
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <LandingGhostButton href={registerUrl} className="w-full">
            {t("landing.ctaGetStarted")}
          </LandingGhostButton>
        </div>
      </LandingGlassCard>

      {/* Pro Tier */}
      <div className="relative">
        <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-1 text-xs font-semibold text-white">
          {t("landing.mostPopular")}
        </span>
        <LandingGlassCard className="flex h-full flex-col border-indigo-500/50 p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-white">
            {t("landing.planPro")}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {t("landing.planProDesc")}
          </p>

          <div className="mt-4">
            {isAnnual ? (
              <>
                <p className="text-4xl font-bold text-white">
                  {t("landing.pricingAnnualPrice")}
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  {t("landing.pricingAnnualBilled")}
                </p>
              </>
            ) : (
              <p className="text-4xl font-bold text-white">
                {t("landing.planProPrice")}
              </p>
            )}
          </div>

          <ul className="mt-6 flex-1 space-y-3">
            {PRO_FEATURES.map((key) => (
              <li key={key} className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                {t(key)}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <LandingGradientButton href={registerUrl} className="w-full">
              {t("landing.ctaFreeTrial")}
            </LandingGradientButton>
          </div>
        </LandingGlassCard>
      </div>
    </div>
  )

  return (
    <LandingSectionWrapper
      id="pricing"
      className="bg-muted/30 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <LandingSectionHeader
          title={`${t("landing.pricingTitle")} ${t("landing.pricingTitleHighlight")}`}
          subtitle={t("landing.pricingSubtitle")}
        />

        {/* Billing Toggle */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                !isAnnual
                  ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t("landing.pricingToggleMonthly")}
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                isAnnual
                  ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t("landing.pricingToggleAnnual")}
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                {t("landing.pricingSaveBadge")}
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        {prefersReducedMotion ? (
          pricingCards
        ) : (
          <motion.div
            variants={containerVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={itemVariant}>
              {pricingCards}
            </motion.div>
          </motion.div>
        )}

        {/* Guarantee */}
        <p className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-emerald-400">
          <Shield className="h-4 w-4" aria-hidden="true" />
          {t("landing.pricingGuarantee")}
        </p>
      </div>
    </LandingSectionWrapper>
  )
}
