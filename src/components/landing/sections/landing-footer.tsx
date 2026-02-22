"use client"

import { BarChart3 } from "lucide-react"

import { useLanguage } from "@/contexts/language-context"
import { useAppUrl } from "@/contexts/app-url-context"

/* ---- Static data ---- */
interface FooterLink {
  labelKey: string
  href: string
  external?: boolean
}

interface FooterColumn {
  titleKey: string
  links: FooterLink[]
}

/* ---- Footer Section ---- */
export function LandingFooter() {
  const { t } = useLanguage()
  const appUrl = useAppUrl()

  const columns: FooterColumn[] = [
    {
      titleKey: "landing.footerProduct",
      links: [
        { labelKey: "landing.navFeatures", href: "#features" },
        { labelKey: "landing.navPricing", href: "#pricing" },
        { labelKey: "landing.ctaLogin", href: `${appUrl}/login` },
        { labelKey: "landing.footerRegister", href: `${appUrl}/register` },
      ],
    },
    {
      titleKey: "landing.footerCompany",
      links: [
        { labelKey: "landing.footerAbout", href: "/about" },
        { labelKey: "landing.footerContact", href: "/contact" },
        { labelKey: "landing.footerBlog", href: "/blog" },
      ],
    },
    {
      titleKey: "landing.footerLegal",
      links: [
        { labelKey: "landing.footerPrivacy", href: "/privacy" },
        { labelKey: "landing.footerTerms", href: "/terms" },
      ],
    },
    {
      titleKey: "landing.footerConnect",
      links: [
        { labelKey: "landing.footerTwitter", href: "https://twitter.com", external: true },
        { labelKey: "landing.footerDiscord", href: "https://discord.com", external: true },
        { labelKey: "landing.footerGithub", href: "https://github.com", external: true },
      ],
    },
  ]

  return (
    <footer className="border-t border-white/[0.06] bg-[#0a0a0f] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Main grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
                <BarChart3 className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold text-white">
                {t("landing.brandName")}
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-400">
              {t("landing.footerTagline")}
            </p>
          </div>

          {/* Link columns */}
          {columns.map(({ titleKey, links }) => (
            <div key={titleKey}>
              <h4 className="text-sm font-semibold text-white">
                {t(titleKey)}
              </h4>
              <ul className="mt-3 space-y-2">
                {links.map(({ labelKey, href, external }) => (
                  <li key={labelKey}>
                    <a
                      href={href}
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                      {...(external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {t(labelKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row">
          <span className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} {t("landing.brandName")}.{" "}
            {t("landing.footerRights")}
          </span>
          <span className="text-sm text-gray-500">
            {t("landing.footerMadeWith")}
          </span>
        </div>
      </div>
    </footer>
  )
}
