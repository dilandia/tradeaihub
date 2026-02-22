"use client"

import { Clock, ArrowRight } from "lucide-react"

import { useLanguage } from "@/contexts/language-context"
import { LandingPageNavbar } from "@/components/landing/shared/landing-page-navbar"
import { LandingSectionWrapper } from "@/components/landing/shared/landing-section-wrapper"
import { LandingSectionHeader } from "@/components/landing/shared/landing-section-header"
import { LandingGlassCard } from "@/components/landing/shared/landing-glass-card"
import { LandingGradientButton } from "@/components/landing/shared/landing-gradient-button"
import { LandingFooter } from "@/components/landing/sections/landing-footer"

const PREVIEW_ARTICLES = [
  {
    titleKey: "landing.blogArticle1Title",
    descKey: "landing.blogArticle1Desc",
    dateKey: "landing.blogArticleSoon",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    titleKey: "landing.blogArticle2Title",
    descKey: "landing.blogArticle2Desc",
    dateKey: "landing.blogArticleSoon",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    titleKey: "landing.blogArticle3Title",
    descKey: "landing.blogArticle3Desc",
    dateKey: "landing.blogArticleSoon",
    gradient: "from-fuchsia-500 to-pink-500",
  },
]

export default function BlogPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-[#121212]">
      <LandingPageNavbar />

      {/* Hero */}
      <LandingSectionWrapper className="px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <LandingSectionHeader
            label={t("landing.blogLabel")}
            title={t("landing.blogHeroTitle")}
            subtitle={t("landing.blogHeroSubtitle")}
          />
        </div>
      </LandingSectionWrapper>

      {/* Coming Soon */}
      <LandingSectionWrapper className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <LandingGlassCard className="p-8 sm:p-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Clock className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              {t("landing.blogComingSoonTitle")}
            </h3>
            <p className="text-gray-400 mb-8 leading-relaxed">
              {t("landing.blogComingSoonDesc")}
            </p>

            {/* Subscribe */}
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <input
                type="email"
                className="w-full max-w-xs rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                placeholder={t("landing.blogEmailPlaceholder")}
              />
              <LandingGradientButton>
                {t("landing.blogSubscribe")}
              </LandingGradientButton>
            </div>
          </LandingGlassCard>
        </div>
      </LandingSectionWrapper>

      {/* Preview Articles */}
      <LandingSectionWrapper className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h3 className="text-lg font-semibold text-white mb-6 text-center">
            {t("landing.blogUpcomingTitle")}
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PREVIEW_ARTICLES.map(
              ({ titleKey, descKey, dateKey, gradient }) => (
                <LandingGlassCard key={titleKey} hover className="overflow-hidden">
                  {/* Gradient placeholder image */}
                  <div
                    className={`h-40 bg-gradient-to-br ${gradient} opacity-80`}
                  />
                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400">
                        {t(dateKey)}
                      </span>
                    </div>
                    <h4 className="text-base font-semibold text-white mb-2">
                      {t(titleKey)}
                    </h4>
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">
                      {t(descKey)}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm text-indigo-400">
                      {t("landing.blogReadMore")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </LandingGlassCard>
              )
            )}
          </div>
        </div>
      </LandingSectionWrapper>

      <LandingFooter />
    </div>
  )
}
