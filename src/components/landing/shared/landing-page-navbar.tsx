"use client"

import { ArrowLeft } from "lucide-react"
import NextLink from "next/link"
import Image from "next/image"

import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/language-selector"

export function LandingPageNavbar() {
  const { t } = useLanguage()

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#121212]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <NextLink
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <Image
            src="/icon-glyph-512x512.png"
            alt="Trade AI Hub"
            width={36}
            height={36}
            className="rounded-[10px] bg-white p-0.5 shadow-sm"
          />
          <span className="text-lg font-bold text-white">
            {t("landing.brandName")}
          </span>
        </NextLink>

        <div className="flex items-center gap-4">
          <LanguageSelector />
          <NextLink
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:border-white/40 hover:bg-white/[0.05]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </NextLink>
        </div>
      </div>
    </nav>
  )
}
