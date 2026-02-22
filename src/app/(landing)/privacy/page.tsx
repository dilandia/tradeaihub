"use client"

import { useLanguage } from "@/contexts/language-context"
import { LandingPageNavbar } from "@/components/landing/shared/landing-page-navbar"
import { LandingFooter } from "@/components/landing/sections/landing-footer"

interface PolicySection {
  titleKey: string
  contentKey: string
}

const SECTIONS: PolicySection[] = [
  {
    titleKey: "landing.privacySection1Title",
    contentKey: "landing.privacySection1Content",
  },
  {
    titleKey: "landing.privacySection2Title",
    contentKey: "landing.privacySection2Content",
  },
  {
    titleKey: "landing.privacySection3Title",
    contentKey: "landing.privacySection3Content",
  },
  {
    titleKey: "landing.privacySection4Title",
    contentKey: "landing.privacySection4Content",
  },
  {
    titleKey: "landing.privacySection5Title",
    contentKey: "landing.privacySection5Content",
  },
  {
    titleKey: "landing.privacySection6Title",
    contentKey: "landing.privacySection6Content",
  },
  {
    titleKey: "landing.privacySection7Title",
    contentKey: "landing.privacySection7Content",
  },
  {
    titleKey: "landing.privacySection8Title",
    contentKey: "landing.privacySection8Content",
  },
  {
    titleKey: "landing.privacySection9Title",
    contentKey: "landing.privacySection9Content",
  },
]

export default function PrivacyPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-[#121212]">
      <LandingPageNavbar />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {t("landing.privacyTitle")}
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            {t("landing.privacyLastUpdated")}
          </p>
          <p className="mt-4 text-gray-400 leading-relaxed">
            {t("landing.privacyIntro")}
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
