"use client"

import { useEffect, useRef, useState } from "react"
import { useReducedMotion, useInView } from "framer-motion"

import { useLanguage } from "@/contexts/language-context"
import { LandingSectionWrapper } from "@/components/landing/shared/landing-section-wrapper"

/* ---- Static data ---- */
const STATS = [
  { target: 10000, suffix: "+", labelKey: "landing.socialProofTraders", format: "compact" },
  { target: 2000000, suffix: "+", labelKey: "landing.socialProofTrades", format: "compact" },
  { target: 35, suffix: "%", labelKey: "landing.socialProofImprovement", format: "number" },
  { target: 4.9, suffix: "/5", labelKey: "landing.socialProofRating", format: "decimal" },
] as const

const BROKER_LOGOS = [
  "MetaTrader 4",
  "MetaTrader 5",
  "cTrader",
  "TradingView",
  "IC Markets",
  "Pepperstone",
] as const

/* ---- Counter hook ---- */
function useAnimatedCounter(
  target: number,
  format: string,
  isInView: boolean,
  duration = 2000
): string {
  const [value, setValue] = useState(0)
  const hasAnimated = useRef(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (!isInView || hasAnimated.current) return

    if (prefersReducedMotion) {
      setValue(target)
      hasAnimated.current = true
      return
    }

    hasAnimated.current = true
    const startTime = performance.now()

    function step(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      setValue(target * eased)

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setValue(target)
      }
    }

    requestAnimationFrame(step)
  }, [isInView, target, duration, prefersReducedMotion])

  if (format === "compact") {
    if (value >= 1000000) return `${(value / 1000000).toFixed(value >= target ? 0 : 1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(value >= target ? 0 : 1)}K`
    return Math.round(value).toLocaleString()
  }
  if (format === "decimal") {
    return value.toFixed(1)
  }
  return Math.round(value).toString()
}

/* ---- Stat Item ---- */
function StatItem({
  target,
  suffix,
  labelKey,
  format,
  isInView,
}: {
  target: number
  suffix: string
  labelKey: string
  format: string
  isInView: boolean
}) {
  const { t } = useLanguage()
  const displayValue = useAnimatedCounter(target, format, isInView)

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="text-3xl font-bold text-white sm:text-4xl">
        {displayValue}
        {suffix}
      </p>
      <p className="text-sm text-gray-400">{t(labelKey)}</p>
    </div>
  )
}

/* ---- Social Proof Section ---- */
export function LandingSocialProof() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <LandingSectionWrapper className="border-y border-white/[0.06] bg-white/[0.02] px-4 py-12 sm:px-6 sm:py-16">
      <div ref={ref} className="mx-auto max-w-5xl">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((stat) => (
            <StatItem
              key={stat.labelKey}
              target={stat.target}
              suffix={stat.suffix}
              labelKey={stat.labelKey}
              format={stat.format}
              isInView={isInView}
            />
          ))}
        </div>

        {/* Broker marquee */}
        <div className="mt-10 overflow-hidden">
          <p className="mb-4 text-center text-xs uppercase tracking-widest text-gray-500">
            Compatible with
          </p>
          <div className="group relative">
            <div
              className="flex items-center gap-12 group-hover:[animation-play-state:paused]"
              style={{
                animation: "landing-marquee 30s linear infinite",
              }}
            >
              {/* Duplicate set for seamless loop */}
              {[...BROKER_LOGOS, ...BROKER_LOGOS].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="shrink-0 whitespace-nowrap text-sm font-medium text-gray-500 opacity-40 transition-opacity hover:opacity-70"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </LandingSectionWrapper>
  )
}
