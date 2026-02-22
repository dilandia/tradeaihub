"use client"

import { CreditCard, Zap, Shield } from "lucide-react"

import { useLanguage } from "@/contexts/language-context"
import { useAppUrl } from "@/contexts/app-url-context"
import { LandingSectionWrapper } from "@/components/landing/shared/landing-section-wrapper"
import { LandingGradientButton } from "@/components/landing/shared/landing-gradient-button"

/* ---- Static data ---- */
const TRUST_ITEMS = [
  { icon: CreditCard, key: "landing.finalCtaTrust1" },
  { icon: Zap, key: "landing.trustSetup" },
  { icon: Shield, key: "landing.finalCtaTrust2" },
] as const

/* ---- Final CTA Section ---- */
export function LandingCtaFinal() {
  const { t } = useLanguage()
  const appUrl = useAppUrl()

  return (
    <LandingSectionWrapper
      className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      {/* Background gradient glow */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-500/[0.08] via-transparent to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
          {t("landing.finalCtaTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-gray-300">
          {t("landing.finalCtaSubtitle")}
        </p>

        <div className="mt-8">
          <LandingGradientButton
            href={`${appUrl}/register`}
            size="lg"
          >
            {t("landing.ctaStartJournal")}
          </LandingGradientButton>
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
          {TRUST_ITEMS.map(({ icon: Icon, key }) => (
            <span key={key} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-gray-500" aria-hidden="true" />
              {t(key)}
            </span>
          ))}
        </div>
      </div>
    </LandingSectionWrapper>
  )
}
