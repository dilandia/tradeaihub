"use client"

import { useLanguage } from "@/contexts/language-context"
import { LandingPageNavbar } from "@/components/landing/shared/landing-page-navbar"
import { LandingFooter } from "@/components/landing/sections/landing-footer"

interface TermsSection {
  titleKey: string
  contentKey: string
}

const SECTIONS: TermsSection[] = [
  {
    titleKey: "landing.termsSection1Title",
    contentKey: "landing.termsSection1Content",
  },
  {
    titleKey: "landing.termsSection2Title",
    contentKey: "landing.termsSection2Content",
  },
  {
    titleKey: "landing.termsSection3Title",
    contentKey: "landing.termsSection3Content",
  },
  {
    titleKey: "landing.termsSection4Title",
    contentKey: "landing.termsSection4Content",
  },
  {
    titleKey: "landing.termsSection5Title",
    contentKey: "landing.termsSection5Content",
  },
  {
    titleKey: "landing.termsSection6Title",
    contentKey: "landing.termsSection6Content",
  },
  {
    titleKey: "landing.termsSection7Title",
    contentKey: "landing.termsSection7Content",
  },
  {
    titleKey: "landing.termsSection8Title",
    contentKey: "landing.termsSection8Content",
  },
  {
    titleKey: "landing.termsSection9Title",
    contentKey: "landing.termsSection9Content",
  },
  {
    titleKey: "landing.termsSection10Title",
    contentKey: "landing.termsSection10Content",
  },
  {
    titleKey: "landing.termsSection11Title",
    contentKey: "landing.termsSection11Content",
  },
  {
    titleKey: "landing.termsSection12Title",
    contentKey: "landing.termsSection12Content",
  },
]

export default function TermsPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-[#121212]">
      <LandingPageNavbar />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {t("landing.termsTitle")}
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            {t("landing.termsLastUpdated")}
          </p>
          <p className="mt-4 text-gray-400 leading-relaxed">
            {t("landing.termsIntro")}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map(({ titleKey, contentKey }, index) => (
            <section key={titleKey}>
              <h2 className="text-xl font-semibold text-white mb-3">
                {index + 1}. {t(titleKey)}
              </h2>
              <div className="text-gray-400 leading-relaxed whitespace-pre-line">
                {t(contentKey)}
              </div>
            </section>
          ))}
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
