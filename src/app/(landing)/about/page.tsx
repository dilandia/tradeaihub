"use client"

import {
  BarChart3,
  Brain,
  Heart,
  Shield,
  Users,
  TrendingUp,
  Target,
} from "lucide-react"

import { useLanguage } from "@/contexts/language-context"
import { LandingPageNavbar } from "@/components/landing/shared/landing-page-navbar"
import { LandingSectionWrapper } from "@/components/landing/shared/landing-section-wrapper"
import { LandingSectionHeader } from "@/components/landing/shared/landing-section-header"
import { LandingGlassCard } from "@/components/landing/shared/landing-glass-card"
import { LandingGradientButton } from "@/components/landing/shared/landing-gradient-button"
import { LandingFooter } from "@/components/landing/sections/landing-footer"

const VALUES = [
  {
    icon: BarChart3,
    titleKey: "landing.aboutValue1Title",
    descKey: "landing.aboutValue1Desc",
  },
  {
    icon: Heart,
    titleKey: "landing.aboutValue2Title",
    descKey: "landing.aboutValue2Desc",
  },
  {
    icon: Brain,
    titleKey: "landing.aboutValue3Title",
    descKey: "landing.aboutValue3Desc",
  },
  {
    icon: Shield,
    titleKey: "landing.aboutValue4Title",
    descKey: "landing.aboutValue4Desc",
  },
]

const STATS = [
  { value: "10K+", labelKey: "landing.socialProofTraders" },
  { value: "2M+", labelKey: "landing.socialProofTrades" },
  { value: "32%", labelKey: "landing.socialProofImprovement" },
  { value: "4.9/5", labelKey: "landing.socialProofRating" },
]

export default function AboutPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-[#121212]">
      <LandingPageNavbar />

      {/* Hero */}
      <LandingSectionWrapper className="px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <LandingSectionHeader
            label={t("landing.aboutLabel")}
            title={t("landing.aboutHeroTitle")}
            subtitle={t("landing.aboutHeroSubtitle")}
          />
        </div>
      </LandingSectionWrapper>

      {/* Mission */}
      <LandingSectionWrapper className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <LandingGlassCard className="p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
                <Target className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {t("landing.aboutMissionTitle")}
              </h3>
            </div>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>{t("landing.aboutMission1")}</p>
              <p>{t("landing.aboutMission2")}</p>
              <p>{t("landing.aboutMission3")}</p>
            </div>
          </LandingGlassCard>
        </div>
      </LandingSectionWrapper>

      {/* Values */}
      <LandingSectionWrapper className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <LandingSectionHeader
            title={t("landing.aboutValuesTitle")}
            subtitle={t("landing.aboutValuesSubtitle")}
            className="mb-12"
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {VALUES.map(({ icon: Icon, titleKey, descKey }) => (
              <LandingGlassCard key={titleKey} hover className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 mb-4">
                  <Icon className="h-6 w-6 text-indigo-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  {t(titleKey)}
                </h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {t(descKey)}
                </p>
              </LandingGlassCard>
            ))}
          </div>
        </div>
      </LandingSectionWrapper>

      {/* Stats */}
      <LandingSectionWrapper className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <LandingGlassCard className="p-8">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {STATS.map(({ value, labelKey }) => (
                <div key={labelKey} className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                    {value}
                  </div>
                  <div className="mt-1 text-sm text-gray-400">
                    {t(labelKey)}
                  </div>
                </div>
              ))}
            </div>
          </LandingGlassCard>
        </div>
      </LandingSectionWrapper>

      {/* CTA */}
      <LandingSectionWrapper className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="h-5 w-5 text-indigo-400" />
            <TrendingUp className="h-5 w-5 text-violet-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">
            {t("landing.aboutCtaTitle")}
          </h3>
          <p className="text-gray-400 mb-8">
            {t("landing.aboutCtaSubtitle")}
          </p>
          <LandingGradientButton href="/#pricing" size="lg">
            {t("landing.ctaStart")}
          </LandingGradientButton>
        </div>
      </LandingSectionWrapper>

      <LandingFooter />
    </div>
  )
}
