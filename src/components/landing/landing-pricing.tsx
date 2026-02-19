"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { APP_URL } from "@/lib/site-config"

type BillingCycle = "monthly" | "annual"

interface Plan {
  name: string
  monthlyPrice: number
  annualPrice: number
  description: string
  features: string[]
  cta: string
  popular: boolean
  accent: "default" | "primary" | "gold"
}

const plans: Plan[] = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "For traders getting started with journaling.",
    features: [
      "Manual CSV import",
      "Up to 100 trades/month",
      "Basic performance metrics",
      "Cumulative P&L chart",
      "Calendar view",
      "Community support",
    ],
    cta: "Get Started",
    popular: false,
    accent: "default",
  },
  {
    name: "Pro",
    monthlyPrice: 14.9,
    annualPrice: 149,
    description: "For active traders who want an edge.",
    features: [
      "MT4/MT5 account sync",
      "Unlimited trades",
      "AI-powered insights",
      "TakeZ Score tracking",
      "Advanced reports & filters",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    popular: true,
    accent: "primary",
  },
  {
    name: "Elite",
    monthlyPrice: 24.9,
    annualPrice: 249,
    description: "For professional traders and fund managers.",
    features: [
      "Everything in Pro",
      "Multi-account management",
      "Strategy comparison engine",
      "Risk exposure alerts",
      "Economic calendar integration",
      "Dedicated account manager",
    ],
    cta: "Start Elite Trial",
    popular: false,
    accent: "gold",
  },
]

function formatPrice(price: number): string {
  if (price === 0) return "$0"
  return `$${price.toFixed(2).replace(/\.00$/, "")}`
}

export function LandingPricing() {
  const [billing, setBilling] = useState<BillingCycle>("monthly")

  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-gray-400">
            Start free, upgrade when you are ready. No hidden fees.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={cn(
              "text-sm px-4 py-2 rounded-lg transition-colors",
              billing === "monthly"
                ? "bg-white/10 text-white"
                : "text-gray-500 hover:text-gray-300"
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling("annual")}
            className={cn(
              "text-sm px-4 py-2 rounded-lg transition-colors",
              billing === "annual"
                ? "bg-white/10 text-white"
                : "text-gray-500 hover:text-gray-300"
            )}
          >
            Annual
            <span className="ml-1.5 text-xs text-profit font-medium">
              Save 17%
            </span>
          </button>
        </div>

        {/* Plan cards */}
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const price =
              billing === "monthly" ? plan.monthlyPrice : plan.annualPrice
            const period = billing === "monthly" ? "/mo" : "/yr"
            const isPopular = plan.popular
            const isGold = plan.accent === "gold"

            return (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-xl border p-6 transition-all",
                  isPopular
                    ? "border-primary/50 bg-[#12121f] shadow-[0_0_30px_rgba(99,102,241,0.1)]"
                    : isGold
                      ? "border-amber-500/30 bg-[#12121f]"
                      : "border-white/5 bg-[#12121f]"
                )}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3
                  className={cn(
                    "text-lg font-semibold",
                    isGold ? "text-amber-400" : "text-white"
                  )}
                >
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{plan.description}</p>

                {/* Price */}
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-bold text-white">
                    {formatPrice(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-sm text-gray-500 ml-1">{period}</span>
                  )}
                  {price === 0 && (
                    <span className="text-sm text-gray-500 ml-1">forever</span>
                  )}
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        className={cn(
                          "h-4 w-4 mt-0.5 shrink-0",
                          isPopular
                            ? "text-primary"
                            : isGold
                              ? "text-amber-400"
                              : "text-gray-500"
                        )}
                      />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={`${APP_URL}/register`}
                  className={cn(
                    "block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors",
                    isPopular
                      ? "bg-primary text-white hover:bg-primary/90"
                      : isGold
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                        : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10"
                  )}
                >
                  {plan.cta}
                </a>
              </div>
            )
          })}
        </div>

        {/* Guarantee */}
        <p className="mt-8 text-center text-xs text-gray-500">
          7-day money-back guarantee on all paid plans. Cancel anytime.
        </p>
      </div>
    </section>
  )
}
