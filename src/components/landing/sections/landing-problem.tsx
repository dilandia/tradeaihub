"use client"

import { motion, useReducedMotion, type Variants } from "framer-motion"
import { X, Check } from "lucide-react"

import { useLanguage } from "@/contexts/language-context"
import { LandingSectionWrapper } from "@/components/landing/shared/landing-section-wrapper"
import { LandingSectionHeader } from "@/components/landing/shared/landing-section-header"

/* ---- Static data (outside component to avoid re-renders) ---- */
const WITHOUT_KEYS = [
  "landing.problemWithout1",
  "landing.problemWithout2",
  "landing.problemWithout3",
  "landing.problemWithout4",
  "landing.problemWithout5",
] as const

const WITH_KEYS = [
  "landing.problemWith1",
  "landing.problemWith2",
  "landing.problemWith3",
  "landing.problemWith4",
  "landing.problemWith5",
] as const

/* ---- Animation variants ---- */
const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
}

const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut", delay: 0.15 },
  },
}

/* ---- Problem Section ---- */
export function LandingProblem() {
  const { t } = useLanguage()
  const prefersReducedMotion = useReducedMotion()

  const MotionOrDiv = prefersReducedMotion ? "div" : motion.div
  const leftProps = prefersReducedMotion
    ? {}
    : {
        variants: slideFromLeft,
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, amount: 0.2 },
      }
  const rightProps = prefersReducedMotion
    ? {}
    : {
        variants: slideFromRight,
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, amount: 0.2 },
      }

  return (
    <LandingSectionWrapper
      id="problem"
      className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <LandingSectionHeader
          label={t("landing.problemLabel")}
          title={t("landing.problemTitle")}
          subtitle={t("landing.problemSubtitle")}
        />

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* WITHOUT card */}
          <MotionOrDiv {...leftProps}>
            <div className="h-full rounded-2xl border border-loss/20 bg-loss/[0.03] p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-white">
                {t("landing.problemWithoutTitle")}
              </h3>
              <ul className="mt-6 space-y-4">
                {WITHOUT_KEYS.map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-loss/20">
                      <X className="h-3 w-3 text-loss" />
                    </span>
                    <span className="text-base leading-relaxed text-gray-400">
                      {t(key)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </MotionOrDiv>

          {/* WITH card */}
          <MotionOrDiv {...rightProps}>
            <div className="h-full rounded-2xl border border-profit/20 bg-profit/[0.03] p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-white">
                {t("landing.problemWithTitle")}
              </h3>
              <ul className="mt-6 space-y-4">
                {WITH_KEYS.map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-profit/20">
                      <Check className="h-3 w-3 text-profit" />
                    </span>
                    <span className="text-base leading-relaxed text-gray-400">
                      {t(key)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </MotionOrDiv>
        </div>
      </div>
    </LandingSectionWrapper>
  )
}
