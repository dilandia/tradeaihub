"use client"

import { Mail, MessageCircle, Twitter, HelpCircle } from "lucide-react"

import { useLanguage } from "@/contexts/language-context"
import { LandingPageNavbar } from "@/components/landing/shared/landing-page-navbar"
import { LandingSectionWrapper } from "@/components/landing/shared/landing-section-wrapper"
import { LandingSectionHeader } from "@/components/landing/shared/landing-section-header"
import { LandingGlassCard } from "@/components/landing/shared/landing-glass-card"
import { LandingGradientButton } from "@/components/landing/shared/landing-gradient-button"
import { LandingFooter } from "@/components/landing/sections/landing-footer"

const SUBJECTS = [
  { value: "general", labelKey: "landing.contactSubjectGeneral" },
  { value: "support", labelKey: "landing.contactSubjectSupport" },
  { value: "partnership", labelKey: "landing.contactSubjectPartnership" },
  { value: "bug", labelKey: "landing.contactSubjectBug" },
]

const CONTACT_CHANNELS = [
  {
    icon: Mail,
    titleKey: "landing.contactEmailTitle",
    value: "support@tradeaihub.com",
    href: "mailto:support@tradeaihub.com",
  },
  {
    icon: MessageCircle,
    titleKey: "landing.contactDiscordTitle",
    value: "Discord",
    href: "https://discord.com",
  },
  {
    icon: Twitter,
    titleKey: "landing.contactTwitterTitle",
    value: "@tradeaihub",
    href: "https://twitter.com/tradeaihub",
  },
]

export default function ContactPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-[#121212]">
      <LandingPageNavbar />

      {/* Hero */}
      <LandingSectionWrapper className="px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <LandingSectionHeader
            label={t("landing.contactLabel")}
            title={t("landing.contactHeroTitle")}
            subtitle={t("landing.contactHeroSubtitle")}
          />
        </div>
      </LandingSectionWrapper>

      {/* Form + Sidebar */}
      <LandingSectionWrapper className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <LandingGlassCard className="p-6 sm:p-8">
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      {t("landing.contactName")}
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                      placeholder={t("landing.contactNamePlaceholder")}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      {t("landing.contactEmail")}
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                      placeholder={t("landing.contactEmailPlaceholder")}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    {t("landing.contactSubject")}
                  </label>
                  <select
                    id="contact-subject"
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                  >
                    {SUBJECTS.map(({ value, labelKey }) => (
                      <option
                        key={value}
                        value={value}
                        className="bg-[#1a1a2e] text-white"
                      >
                        {t(labelKey)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    {t("landing.contactMessage")}
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    className="w-full resize-none rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                    placeholder={t("landing.contactMessagePlaceholder")}
                  />
                </div>

                <LandingGradientButton>
                  {t("landing.contactSend")}
                </LandingGradientButton>
              </form>
            </LandingGlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {CONTACT_CHANNELS.map(({ icon: Icon, titleKey, value, href }) => (
              <LandingGlassCard key={titleKey} hover className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20">
                    <Icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {t(titleKey)}
                    </h4>
                    <a
                      href={href}
                      className="mt-1 block text-sm text-indigo-400 transition-colors hover:text-indigo-300"
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                    >
                      {value}
                    </a>
                  </div>
                </div>
              </LandingGlassCard>
            ))}

            {/* FAQ Link */}
            <LandingGlassCard hover className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
                  <HelpCircle className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {t("landing.contactFaqTitle")}
                  </h4>
                  <a
                    href="/#faq"
                    className="mt-1 block text-sm text-violet-400 transition-colors hover:text-violet-300"
                  >
                    {t("landing.contactFaqLink")}
                  </a>
                </div>
              </div>
            </LandingGlassCard>
          </div>
        </div>
      </LandingSectionWrapper>

      <LandingFooter />
    </div>
  )
}
