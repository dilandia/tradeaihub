"use client"

import { motion, useReducedMotion, type Variants } from "framer-motion"
import {
  Upload,
  BarChart3,
  Sparkles,
  Target,
  Shield,
  Calendar,
} from "lucide-react"

import { useLanguage } from "@/contexts/language-context"
import { LandingSectionWrapper } from "@/components/landing/shared/landing-section-wrapper"
import { LandingSectionHeader } from "@/components/landing/shared/landing-section-header"
import { LandingGlassCard } from "@/components/landing/shared/landing-glass-card"

/* ---- Static feature data (outside component) ---- */
const FEATURES = [
  { icon: Upload, titleKey: "landing.feature1Title", descKey: "landing.feature1Desc" },
  { icon: BarChart3, titleKey: "landing.feature2Title", descKey: "landing.feature2Desc" },
  { icon: Sparkles, titleKey: "landing.feature3Title", descKey: "landing.feature3Desc" },
  { icon: Target, titleKey: "landing.feature4Title", descKey: "landing.feature4Desc" },
  { icon: Shield, titleKey: "landing.feature5Title", descKey: "landing.feature5Desc" },
  { icon: Calendar, titleKey: "landing.feature6Title", descKey: "landing.feature6Desc" },
] as const

/* ---- Animation variants ---- */
const containerVariant: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
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

/* ---- Features Core Section ---- */
export function LandingFeaturesCore() {
  const { t } = useLanguage()
  const prefersReducedMotion = useReducedMotion()

  return (
    <LandingSectionWrapper
      id="features"
      className="bg-muted/30 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <LandingSectionHeader
          label={t("landing.featuresLabel")}
          title={t("landing.featuresTitle")}
          subtitle={t("landing.featuresSubtitle")}
        />

        {prefersReducedMotion ? (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {FEATURES.map(({ icon: Icon, titleKey, descKey }) => (
              <LandingGlassCard key={titleKey} hover className="p-6 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
                  <Icon className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">
                  {t(titleKey)}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-gray-400">
                  {t(descKey)}
                </p>
              </LandingGlassCard>
            ))}
          </div>
        ) : (
          <motion.div
            className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8"
            variants={containerVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {FEATURES.map(({ icon: Icon, titleKey, descKey }) => (
              <motion.div key={titleKey} variants={itemVariant}>
                <LandingGlassCard hover className="p-6 sm:p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
                    <Icon className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-white">
                    {t(titleKey)}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-gray-400">
                    {t(descKey)}
                  </p>
                </LandingGlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </LandingSectionWrapper>
  )
}
