"use client"

import { useState } from "react"
import {
  DollarSign,
  Clock,
  BarChart3,
  Users,
  Zap,
  HeartHandshake,
  GraduationCap,
  Youtube,
  MessageCircle,
  FileText,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Link2,
} from "lucide-react"
import type { Metadata } from "next"

import { useLanguage } from "@/contexts/language-context"
import { LandingPageNavbar } from "@/components/landing/shared/landing-page-navbar"
import { LandingSectionWrapper } from "@/components/landing/shared/landing-section-wrapper"
import { LandingSectionHeader } from "@/components/landing/shared/landing-section-header"
import { LandingGlassCard } from "@/components/landing/shared/landing-glass-card"
import { LandingGradientButton } from "@/components/landing/shared/landing-gradient-button"
import { LandingFooter } from "@/components/landing/sections/landing-footer"

// ─── FAQ Accordion ───────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left text-white hover:bg-white/5 transition-colors"
      >
        <span className="font-medium">{question}</span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-4 text-sm text-gray-400 leading-relaxed border-t border-white/10 pt-4">
          {answer}
        </div>
      )}
    </div>
  )
}

// ─── Application Form ─────────────────────────────────────────────────────────

function ApplicationForm() {
  const { t } = useLanguage()
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    primarySocial: "",
    socialUrl: "",
    audienceSize: "",
    pitch: "",
    tradingExperience: "",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/affiliates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || t("affiliates.formError"))
      } else {
        setSuccess(true)
      }
    } catch {
      setError(t("affiliates.formError"))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <p className="text-lg font-semibold text-white">{t("affiliates.formSuccess")}</p>
      </div>
    )
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5"

  const platforms = [
    "YouTube", "Instagram", "TikTok", "Twitter/X", "Telegram", "Discord",
    "Blog/Website", "Newsletter", "Podcast", "Other",
  ]
  const audienceSizes = [
    { value: "under_1k", label: t("affiliates.audienceUnder1k") },
    { value: "1k_5k", label: t("affiliates.audience1k5k") },
    { value: "5k_25k", label: t("affiliates.audience5k25k") },
    { value: "25k_100k", label: t("affiliates.audience25k100k") },
    { value: "over_100k", label: t("affiliates.audienceOver100k") },
  ]
  const tradingOptions = [
    { value: "yes_active", label: t("affiliates.tradingYesActive") },
    { value: "yes_occ", label: t("affiliates.tradingYesOcc") },
    { value: "no_audience", label: t("affiliates.tradingNoAudience") },
    { value: "no", label: t("affiliates.tradingNo") },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t("affiliates.formName")} *</label>
          <input
            type="text"
            required
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            className={inputClass}
            placeholder="John Smith"
          />
        </div>
        <div>
          <label className={labelClass}>{t("affiliates.formEmail")} *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t("affiliates.formWhatsapp")} *</label>
          <input
            type="text"
            required
            value={form.whatsapp}
            onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
            className={inputClass}
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div>
          <label className={labelClass}>{t("affiliates.formPlatform")} *</label>
          <select
            required
            value={form.primarySocial}
            onChange={(e) => setForm((f) => ({ ...f, primarySocial: e.target.value }))}
            className={inputClass}
          >
            <option value="" disabled>{t("affiliates.formPlatformPlaceholder")}</option>
            {platforms.map((p) => (
              <option key={p} value={p.toLowerCase().replace("/", "_")}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t("affiliates.formUrl")} *</label>
          <input
            type="url"
            required
            value={form.socialUrl}
            onChange={(e) => setForm((f) => ({ ...f, socialUrl: e.target.value }))}
            className={inputClass}
            placeholder={t("affiliates.formUrlPlaceholder")}
          />
        </div>
        <div>
          <label className={labelClass}>{t("affiliates.formAudienceSize")} *</label>
          <select
            required
            value={form.audienceSize}
            onChange={(e) => setForm((f) => ({ ...f, audienceSize: e.target.value }))}
            className={inputClass}
          >
            <option value="" disabled>{t("affiliates.formAudienceSizePlaceholder")}</option>
            {audienceSizes.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>{t("affiliates.formTrading")}</label>
        <select
          value={form.tradingExperience}
          onChange={(e) => setForm((f) => ({ ...f, tradingExperience: e.target.value }))}
          className={inputClass}
        >
          <option value="">{t("affiliates.formTradingPlaceholder")}</option>
          {tradingOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>{t("affiliates.formPitch")} *</label>
        <textarea
          required
          minLength={50}
          maxLength={1000}
          rows={5}
          value={form.pitch}
          onChange={(e) => setForm((f) => ({ ...f, pitch: e.target.value }))}
          className={inputClass}
          placeholder={t("affiliates.formPitchPlaceholder")}
        />
        <p className="mt-1 text-xs text-gray-600 text-right">{form.pitch.length}/1000</p>
      </div>

      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" />{t("affiliates.formSubmit")}</>
        ) : t("affiliates.formSubmit")}
      </button>

      <p className="text-xs text-gray-500 text-center">{t("affiliates.formNote")}</p>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AffiliatesPage() {
  const { t } = useLanguage()

  const steps = [
    { label: t("affiliates.step1Label"), title: t("affiliates.step1Title"), desc: t("affiliates.step1Desc"), num: "01" },
    { label: t("affiliates.step2Label"), title: t("affiliates.step2Title"), desc: t("affiliates.step2Desc"), num: "02" },
    { label: t("affiliates.step3Label"), title: t("affiliates.step3Title"), desc: t("affiliates.step3Desc"), num: "03" },
    { label: t("affiliates.step4Label"), title: t("affiliates.step4Title"), desc: t("affiliates.step4Desc"), num: "04" },
  ]

  const benefits = [
    { icon: DollarSign, title: t("affiliates.benefit1Title"), desc: t("affiliates.benefit1Desc") },
    { icon: Zap, title: t("affiliates.benefit2Title"), desc: t("affiliates.benefit2Desc") },
    { icon: Clock, title: t("affiliates.benefit3Title"), desc: t("affiliates.benefit3Desc") },
    { icon: BarChart3, title: t("affiliates.benefit4Title"), desc: t("affiliates.benefit4Desc") },
    { icon: Users, title: t("affiliates.benefit5Title"), desc: t("affiliates.benefit5Desc") },
    { icon: HeartHandshake, title: t("affiliates.benefit6Title"), desc: t("affiliates.benefit6Desc") },
  ]

  const profiles = [
    { icon: GraduationCap, title: t("affiliates.who1Title"), desc: t("affiliates.who1Desc") },
    { icon: Youtube, title: t("affiliates.who2Title"), desc: t("affiliates.who2Desc") },
    { icon: MessageCircle, title: t("affiliates.who3Title"), desc: t("affiliates.who3Desc") },
    { icon: FileText, title: t("affiliates.who4Title"), desc: t("affiliates.who4Desc") },
  ]

  const faqs = [
    { q: t("affiliates.faq1Q"), a: t("affiliates.faq1A") },
    { q: t("affiliates.faq2Q"), a: t("affiliates.faq2A") },
    { q: t("affiliates.faq3Q"), a: t("affiliates.faq3A") },
    { q: t("affiliates.faq4Q"), a: t("affiliates.faq4A") },
    { q: t("affiliates.faq5Q"), a: t("affiliates.faq5A") },
  ]

  const commissionDetails = [
    t("affiliates.commissionDetails1"),
    t("affiliates.commissionDetails2"),
    t("affiliates.commissionDetails3"),
    t("affiliates.commissionDetails4"),
    t("affiliates.commissionDetails5"),
  ]

  return (
    <div className="min-h-screen bg-[#121212]">
      <LandingPageNavbar />

      {/* ── Hero ── */}
      <LandingSectionWrapper className="px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-indigo-500/10 border border-indigo-500/30 px-4 py-1 text-xs font-semibold tracking-widest text-indigo-400 mb-6">
            {t("affiliates.heroBadge")}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl mb-6">
            {t("affiliates.heroTitle")}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-400 mb-8">
            {t("affiliates.heroSubtitle")}
          </p>
          <a
            href="#apply"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3.5 text-sm font-semibold text-white hover:opacity-90 transition-all"
          >
            <Link2 className="h-4 w-4" />
            {t("affiliates.heroCta")}
          </a>
          <p className="mt-4 text-xs text-gray-600">{t("affiliates.heroTrust")}</p>
        </div>
      </LandingSectionWrapper>

      {/* ── How it Works ── */}
      <LandingSectionWrapper className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <LandingSectionHeader title={t("affiliates.howItWorksTitle")} className="mb-12" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <LandingGlassCard key={step.num} className="p-6 relative">
                <div className="text-4xl font-bold text-indigo-500/20 absolute top-4 right-4">
                  {step.num}
                </div>
                <span className="text-xs font-semibold tracking-widest text-indigo-400 mb-3 block">
                  {step.label}
                </span>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
              </LandingGlassCard>
            ))}
          </div>
        </div>
      </LandingSectionWrapper>

      {/* ── Benefits ── */}
      <LandingSectionWrapper className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <LandingSectionHeader title={t("affiliates.benefitsTitle")} className="mb-12" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <LandingGlassCard key={title} hover className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 mb-4">
                  <Icon className="h-5 w-5 text-indigo-400" />
                </div>
                <h4 className="text-base font-semibold text-white mb-2">{title}</h4>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </LandingGlassCard>
            ))}
          </div>
        </div>
      </LandingSectionWrapper>

      {/* ── Who is it for ── */}
      <LandingSectionWrapper className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <LandingSectionHeader
            title={t("affiliates.whoTitle")}
            subtitle={t("affiliates.whoSubtitle")}
            className="mb-12"
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {profiles.map(({ icon: Icon, title, desc }) => (
              <LandingGlassCard key={title} hover className="p-6 flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/20">
                  <Icon className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white mb-1">{title}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                </div>
              </LandingGlassCard>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-gray-400 italic">{t("affiliates.whoBottom")}</p>
        </div>
      </LandingSectionWrapper>

      {/* ── Commissions ── */}
      <LandingSectionWrapper className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <LandingSectionHeader
            title={t("affiliates.commissionsTitle")}
            subtitle={t("affiliates.commissionsSubtitle")}
            className="mb-12"
          />
          <LandingGlassCard className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                <DollarSign className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-white">{t("affiliates.commissionRate")}</p>
            </div>
            <ul className="space-y-3">
              {commissionDetails.map((detail) => (
                <li key={detail} className="flex items-start gap-2 text-sm text-gray-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  {detail}
                </li>
              ))}
            </ul>
          </LandingGlassCard>
        </div>
      </LandingSectionWrapper>

      {/* ── FAQ ── */}
      <LandingSectionWrapper className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <LandingSectionHeader title={t("affiliates.faqTitle")} className="mb-12" />
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </LandingSectionWrapper>

      {/* ── Application Form ── */}
      <LandingSectionWrapper id="apply" className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <LandingSectionHeader
            title={t("affiliates.formTitle")}
            subtitle={t("affiliates.formSubtitle")}
            className="mb-10"
          />
          <LandingGlassCard className="p-8">
            <ApplicationForm />
          </LandingGlassCard>
        </div>
      </LandingSectionWrapper>

      {/* ── Closing CTA ── */}
      <section className="bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border-y border-indigo-500/20">
        <LandingSectionWrapper className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-white mb-4">{t("affiliates.ctaTitle")}</h2>
            <p className="text-gray-400 mb-8">{t("affiliates.ctaBody")}</p>
            <a
              href="#apply"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3.5 text-sm font-semibold text-white hover:opacity-90 transition-all"
            >
              {t("affiliates.ctaButton")}
            </a>
            <p className="mt-4 text-xs text-gray-600">{t("affiliates.ctaMicro")}</p>
          </div>
        </LandingSectionWrapper>
      </section>

      <LandingFooter />
    </div>
  )
}
