"use client"

import { useState, useCallback, useId } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ChevronDown } from "lucide-react"

import { useLanguage } from "@/contexts/language-context"
import { LandingSectionWrapper } from "@/components/landing/shared/landing-section-wrapper"
import { LandingSectionHeader } from "@/components/landing/shared/landing-section-header"
import { LandingGlassCard } from "@/components/landing/shared/landing-glass-card"

/* ---- Static data ---- */
const FAQ_ITEMS = [
  { q: "landing.faq1Q", a: "landing.faq1A" },
  { q: "landing.faq2Q", a: "landing.faq2A" },
  { q: "landing.faq3Q", a: "landing.faq3A" },
  { q: "landing.faq4Q", a: "landing.faq4A" },
  { q: "landing.faq5Q", a: "landing.faq5A" },
  { q: "landing.faq6Q", a: "landing.faq6A" },
  { q: "landing.faq7Q", a: "landing.faq7A" },
] as const

/* ---- FAQ Section ---- */
export function LandingFaq() {
  const { t } = useLanguage()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const baseId = useId()

  const handleToggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }, [])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key === "ArrowDown") {
        event.preventDefault()
        const nextIndex = index < FAQ_ITEMS.length - 1 ? index + 1 : 0
        const nextButton = document.getElementById(`${baseId}-trigger-${nextIndex}`)
        nextButton?.focus()
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        const prevIndex = index > 0 ? index - 1 : FAQ_ITEMS.length - 1
        const prevButton = document.getElementById(`${baseId}-trigger-${prevIndex}`)
        prevButton?.focus()
      }
    },
    [baseId]
  )

  return (
    <LandingSectionWrapper
      id="faq"
      className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-3xl">
        <LandingSectionHeader
          title={t("landing.faqTitle")}
          subtitle={t("landing.faqSubtitle")}
        />

        <div className="mt-12 space-y-4" role="list">
          {FAQ_ITEMS.map(({ q, a }, index) => {
            const isOpen = openIndex === index
            const triggerId = `${baseId}-trigger-${index}`
            const panelId = `${baseId}-panel-${index}`

            return (
              <LandingGlassCard key={q} className="overflow-hidden">
                <button
                  type="button"
                  id={triggerId}
                  onClick={() => handleToggle(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between px-5 py-4 text-left font-medium text-white transition-colors hover:text-gray-200 sm:px-6"
                >
                  <span>{t(q)}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {prefersReducedMotion ? (
                  isOpen ? (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={triggerId}
                      className="border-t border-white/[0.08] px-5 pb-5 pt-4 text-sm leading-relaxed text-gray-400 sm:px-6"
                    >
                      {t(a)}
                    </div>
                  ) : null
                ) : (
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        role="region"
                        aria-labelledby={triggerId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/[0.08] px-5 pb-5 pt-4 text-sm leading-relaxed text-gray-400 sm:px-6">
                          {t(a)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </LandingGlassCard>
            )
          })}
        </div>
      </div>
    </LandingSectionWrapper>
  )
}
