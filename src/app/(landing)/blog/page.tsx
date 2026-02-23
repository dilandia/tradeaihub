"use client"

import { Clock, ArrowRight, Calendar } from "lucide-react"
import Link from "next/link"

import { useLanguage } from "@/contexts/language-context"
import { LandingPageNavbar } from "@/components/landing/shared/landing-page-navbar"
import { LandingSectionWrapper } from "@/components/landing/shared/landing-section-wrapper"
import { LandingSectionHeader } from "@/components/landing/shared/landing-section-header"
import { LandingGlassCard } from "@/components/landing/shared/landing-glass-card"
import { LandingGradientButton } from "@/components/landing/shared/landing-gradient-button"
import { LandingFooter } from "@/components/landing/sections/landing-footer"

const ARTICLES = [
  {
    titleKey: "landing.blogArticle1Title",
    descKey: "landing.blogArticle1Desc",
    href: "/blog/5-metrics-every-forex-trader-should-track",
    date: "Feb 20, 2026",
    readTime: 8,
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    titleKey: "landing.blogArticle2Title",
    descKey: "landing.blogArticle2Desc",
    href: "/blog/how-ai-is-changing-trading-journaling",
    date: "Feb 18, 2026",
    readTime: 7,
    gradient: "from-violet-500 to-purple-500",
  },
  {
    titleKey: "landing.blogArticle3Title",
    descKey: "landing.blogArticle3Desc",
    href: "/blog/from-losing-to-winning-data-driven-approach",
    date: "Feb 15, 2026",
    readTime: 9,
    gradient: "from-fuchsia-500 to-pink-500",
  },
] as const

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

      {/* Articles */}
      <LandingSectionWrapper className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.map(
              ({ titleKey, descKey, href, date, readTime, gradient }) => (
                <Link key={titleKey} href={href} className="group">
                  <LandingGlassCard hover className="overflow-hidden h-full">
                    {/* Gradient placeholder image */}
                    <div
                      className={`h-40 bg-gradient-to-br ${gradient} opacity-80 transition-opacity group-hover:opacity-100`}
                    />
                    <div className="p-5">
                      <div className="mb-3 flex items-center gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {date}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {readTime} {t("landing.blogMinRead")}
                        </span>
                      </div>
                      <h4 className="text-base font-semibold text-white mb-2">
                        {t(titleKey)}
                      </h4>
                      <p className="text-sm text-gray-400 leading-relaxed mb-4">
                        {t(descKey)}
                      </p>
                      <span className="inline-flex items-center gap-1 text-sm text-indigo-400 transition-colors group-hover:text-indigo-300">
                        {t("landing.blogReadArticle")}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </LandingGlassCard>
                </Link>
              )
            )}
          </div>
        </div>
      </LandingSectionWrapper>

      {/* Subscribe */}
      <LandingSectionWrapper className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <LandingGlassCard className="p-8 sm:p-10">
            <h3 className="text-xl font-bold text-white mb-3">
              {t("landing.blogComingSoonTitle")}
            </h3>
            <p className="text-gray-400 mb-8 leading-relaxed">
              {t("landing.blogComingSoonDesc")}
            </p>

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

      <LandingFooter />
    </div>
  )
}
