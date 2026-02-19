"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FaqItem {
  question: string
  answer: string
}

const faqs: FaqItem[] = [
  {
    question: "Is there a free plan?",
    answer:
      "Yes, TakeZ Plan offers a free forever plan that includes manual CSV imports, up to 100 trades per month, basic performance metrics, and a cumulative P&L chart. No credit card required to get started.",
  },
  {
    question: "What trading platforms do you support?",
    answer:
      "We currently support MetaTrader 4 (MT4), MetaTrader 5 (MT5), and manual CSV report imports. Account sync is available on Pro and Elite plans. We are continuously working to add more platform integrations.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. There are no contracts or commitments. You can cancel your subscription at any time from your account settings, and you will retain access until the end of your billing period.",
  },
  {
    question: "What is the TakeZ Score?",
    answer:
      "TakeZ Score is our proprietary AI-powered composite metric that evaluates your trading performance on a 0-100 scale. It considers risk management, consistency, win rate, profit factor, and behavioral patterns to give you a holistic view of your trading quality.",
  },
  {
    question: "Do you offer a money-back guarantee?",
    answer:
      "Yes, all paid plans come with a 7-day money-back guarantee. If you are not satisfied with TakeZ Plan, contact our support team within 7 days of your purchase for a full refund — no questions asked.",
  },
]

function FaqAccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="text-sm font-medium text-white pr-4">
          {item.question}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          open ? "max-h-60 pb-5" : "max-h-0"
        )}
      >
        <p className="text-sm leading-relaxed text-gray-400">{item.answer}</p>
      </div>
    </div>
  )
}

export function LandingFaq() {
  return (
    <section id="faq" className="py-20 sm:py-28 bg-[#0d0d15]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-gray-400">
            Everything you need to know about TakeZ Plan.
          </p>
        </div>

        {/* Accordion */}
        <div className="rounded-xl border border-white/5 bg-[#12121f] px-6">
          {faqs.map((faq) => (
            <FaqAccordionItem key={faq.question} item={faq} />
          ))}
        </div>
      </div>
    </section>
  )
}
