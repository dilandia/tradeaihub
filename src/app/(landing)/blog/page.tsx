"use client"

import { useState } from "react"
import { Clock, ArrowRight, Calendar, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"
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
    image: "/blog/blog-metrics.png",
  },
  {
    titleKey: "landing.blogArticle2Title",
    descKey: "landing.blogArticle2Desc",
    href: "/blog/how-ai-is-changing-trading-journaling",
    date: "Feb 18, 2026",
    readTime: 7,
    image: "/blog/blog-ai-journal.png",
  },
  {
    titleKey: "landing.blogArticle3Title",
    descKey: "landing.blogArticle3Desc",
    href: "/blog/from-losing-to-winning-data-driven-approach",
    date: "Feb 15, 2026",
    readTime: 9,
    image: "/blog/blog-data-driven.png",
  },
  {
    titleKey: "landing.blogArticle4Title",
    descKey: "landing.blogArticle4Desc",
    href: "/blog/the-psychology-of-successful-trading",
    date: "Feb 25, 2026",
    readTime: 10,
    image: "/blog/blog-trading-psychology.png",
  },
  {
    titleKey: "landing.blogArticle5Title",
    descKey: "landing.blogArticle5Desc",
    href: "/blog/position-sizing-explained",
    date: "Feb 25, 2026",
    readTime: 8,
    image: "/blog/blog-position-sizing.png",
  },
] as const

export default function BlogPage() {
  const { t, locale } = useLanguage()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubscribe = async () => {
    setError("")
    setSuccess(false)

    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(locale === "pt-BR" ? "Email invalido." : "Invalid email address.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/blog/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, locale }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error || (locale === "pt-BR" ? "Erro ao inscrever." : "Failed to subscribe."))
        return
      }

      setSuccess(true)
      setEmail("")
    } catch {
      setError(locale === "pt-BR" ? "Erro de conexao. Tente novamente." : "Connection error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <LandingPageNavbar />

      {/* Hero */}
      <LandingSectionWrapper className="px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="sr-only">Trade AI Hub Blog — Trading Tips, Forex Strategies & AI Analytics</h1>
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
              ({ titleKey, descKey, href, date, readTime, image }) => (
                <Link key={titleKey} href={href} className="group">
                  <LandingGlassCard hover className="overflow-hidden h-full">
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={image}
                        alt={t(titleKey)}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
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

            {success ? (
              <div className="flex items-center justify-center gap-2 text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {locale === "pt-BR"
                    ? "Inscrito com sucesso! Obrigado."
                    : "Subscribed successfully! Thank you."}
                </span>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) setError("")
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubscribe()
                    }}
                    disabled={loading}
                    className="w-full max-w-xs rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50"
                    placeholder={t("landing.blogEmailPlaceholder")}
                  />
                  <LandingGradientButton onClick={handleSubscribe}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("landing.blogSubscribe")
                    )}
                  </LandingGradientButton>
                </div>
                {error && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs">{error}</span>
                  </div>
                )}
              </>
            )}
          </LandingGlassCard>
        </div>
      </LandingSectionWrapper>

      <LandingFooter />
    </div>
  )
}
