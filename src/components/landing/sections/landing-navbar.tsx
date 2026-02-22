"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Menu, X, ArrowRight, BarChart3 } from "lucide-react"
import NextLink from "next/link"

import { useLanguage } from "@/contexts/language-context"
import { useAppUrl } from "@/contexts/app-url-context"
import { LanguageSelector } from "@/components/language-selector"
import { LandingGradientButton } from "@/components/landing/shared/landing-gradient-button"

const NAV_LINKS = [
  { key: "landing.navFeatures", href: "#features" },
  { key: "landing.navPricing", href: "#pricing" },
  { key: "landing.navFaq", href: "#faq" },
] as const

export function LandingNavbar() {
  const { t } = useLanguage()
  const appUrl = useAppUrl()
  const prefersReducedMotion = useReducedMotion()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <header
      className={[
        "fixed top-0 z-50 w-full bg-[#121212]/80 backdrop-blur-xl transition-all duration-300",
        scrolled ? "border-b border-white/[0.06]" : "",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">
            {t("landing.brandName")}
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map(({ key, href }) => (
            <a
              key={key}
              href={href}
              className="text-sm font-medium text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212] rounded"
            >
              {t(key)}
            </a>
          ))}
        </nav>

        {/* Desktop right side */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSelector />
          <NextLink
            href={`${appUrl}/login`}
            className="text-sm font-medium text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212] rounded px-3 py-2"
          >
            {t("landing.ctaLogin")}
          </NextLink>
          <LandingGradientButton href={`${appUrl}/register`}>
            {t("landing.ctaStartJournal")}
            <ArrowRight className="h-4 w-4" />
          </LandingGradientButton>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="border-t border-white/[0.06] bg-[#121212]/95 backdrop-blur-xl md:hidden overflow-hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-4">
              {NAV_LINKS.map(({ key, href }) => (
                <a
                  key={key}
                  href={href}
                  onClick={closeMobile}
                  className="rounded-lg px-4 py-3 text-base font-medium text-gray-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  {t(key)}
                </a>
              ))}
              <div className="my-2 border-t border-white/[0.06]" />
              <div className="px-4 py-2">
                <LanguageSelector />
              </div>
              <div className="my-2 border-t border-white/[0.06]" />
              <NextLink
                href={`${appUrl}/login`}
                onClick={closeMobile}
                className="rounded-lg px-4 py-3 text-base font-medium text-gray-300 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                {t("landing.ctaLogin")}
              </NextLink>
              <div className="px-4 pt-2">
                <LandingGradientButton
                  href={`${appUrl}/register`}
                  size="lg"
                  className="w-full"
                >
                  {t("landing.ctaStartJournal")}
                  <ArrowRight className="h-4 w-4" />
                </LandingGradientButton>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
