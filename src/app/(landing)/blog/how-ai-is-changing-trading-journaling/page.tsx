"use client"

import { ArrowLeft, Calendar, Clock } from "lucide-react"
import Link from "next/link"

import { useLanguage } from "@/contexts/language-context"
import { useAppUrl } from "@/contexts/app-url-context"
import { LandingPageNavbar } from "@/components/landing/shared/landing-page-navbar"
import { LandingSectionWrapper } from "@/components/landing/shared/landing-section-wrapper"
import { LandingGlassCard } from "@/components/landing/shared/landing-glass-card"
import { LandingGradientButton } from "@/components/landing/shared/landing-gradient-button"
import { LandingFooter } from "@/components/landing/sections/landing-footer"

export default function AiJournalingArticlePage() {
  const { t } = useLanguage()
  const appUrl = useAppUrl()

  return (
    <div className="min-h-screen bg-[#121212]">
      <LandingPageNavbar />

      {/* Hero */}
      <LandingSectionWrapper className="px-4 pb-12 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-indigo-400"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("landing.blogLabel")}
          </Link>
          <div className="mb-6 h-48 sm:h-64 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 opacity-80" />
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Feb 18, 2026
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              7 {t("landing.blogMinRead")}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            {t("landing.blogArticle2Title")}
          </h1>
        </div>
      </LandingSectionWrapper>

      {/* Article Body */}
      <LandingSectionWrapper className="px-4 pb-16 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-3xl">
          <p className="text-gray-300 leading-relaxed mb-4">
            For decades, the trading journal lived in one of two places: a leather notebook on the desk or a sprawling spreadsheet with dozens of tabs. Disciplined traders swore by them. They would meticulously record every entry, exit, lot size, and emotional state after each session. And it worked, for those who stuck with it. But the reality is that most traders abandoned their journals within weeks. The process was tedious, the analysis was manual, and the insights, if they came at all, required hours of review.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            Artificial intelligence is changing all of that. Today, AI-powered trading journals do not just store data. They understand it, find patterns in it, and deliver insights that would take a human analyst hours or days to uncover. This is not a marginal improvement. It is a fundamental shift in how traders interact with their own performance data.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            Pattern Recognition at Scale
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Human beings are remarkably good at seeing patterns, even when they do not exist. This is called apophenia, and it is one of a trader&apos;s worst enemies. You might think you perform better on Fridays, or that GBP/JPY is your best pair, but without rigorous statistical analysis across hundreds of trades, you are just guessing.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            AI pattern recognition changes this by analyzing your entire trade history objectively. It examines every variable: time of day, day of week, currency pair, session (London, New York, Tokyo), trade duration, lot size, direction (long vs short), and market conditions at the time of entry. From this multidimensional analysis, genuine patterns emerge.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            For example, an AI might discover that your win rate on EUR/USD is 62% during the London session but drops to 38% during Asian hours. Or that your trades taken within 15 minutes of a high-impact news event have a profit factor of 0.7, meaning they are actively losing money. These are not vague observations. They are actionable insights backed by your actual data.
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">Key advantage:</span> AI analyzes all variables simultaneously across your entire history. A human reviewing a spreadsheet might check one variable at a time and miss multivariate patterns like &quot;long trades on GBP/USD during New York overlap with position sizes above 1 lot have a 73% win rate.&quot;
            </p>
          </LandingGlassCard>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            Behavioral Analysis: Your Trading Psychology Revealed
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            The most destructive patterns in trading are not technical. They are behavioral. Revenge trading after a loss. Overtrading on volatile days. Moving stop-losses to avoid being stopped out. Closing winning trades too early out of fear. These behaviors are well-documented in trading psychology, but identifying them in your own trading is incredibly difficult because you are too close to see clearly.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            AI behavioral analysis detects these patterns by examining the sequence and timing of your trades. It can identify when you take multiple trades in rapid succession after a losing trade, a classic revenge trading signature. It can flag sessions where your position sizes increase after losses, indicating emotional decision-making. It can even detect when you consistently exit profitable trades earlier than your planned target, revealing a fear-based closing pattern.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            What makes this transformative is that the AI presents these findings without judgment or emotion. It is simply reporting what the data shows. This objectivity helps traders accept feedback that they might reject from a mentor or trading coach. The numbers do not lie, and when you see that your post-loss trades have a win rate of 28% compared to your normal 52%, the case for stepping away after a loss becomes impossible to ignore.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            Automated Insights: Hours of Analysis in Seconds
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Traditional trade review is a weekend ritual. You sit down with your journal, scroll through the week&apos;s trades, try to calculate your metrics, and attempt to draw conclusions. If you are disciplined, this takes one to two hours. Most traders skip it entirely.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            AI-powered journals generate insights automatically after every trade or session. The moment you import your trades or close a position, the AI analyzes your performance, updates your metrics, compares them to historical baselines, and highlights anything noteworthy. You might get a notification that says &quot;Your risk-reward ratio has improved 15% this week compared to your 30-day average&quot; or &quot;You are 3 trades into a losing streak. Historically, your 4th trade after 3 consecutive losses has a 22% win rate.&quot;
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 mb-6 ml-4">
            <li>Real-time performance summaries after each trading session</li>
            <li>Weekly and monthly report generation with trend analysis</li>
            <li>Anomaly detection when your performance deviates from your baseline</li>
            <li>Strategy comparison showing which approaches are working best</li>
            <li>Risk alerts when your drawdown approaches historical limits</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            AI-Powered Risk Management
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Risk management is where most traders fail, and it is also where AI can add the most value. Traditional risk management is static: risk 1% per trade, set a stop loss, do not overleverage. These rules are a good starting point, but they do not adapt to your actual performance data.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            An AI risk analysis agent can evaluate your current drawdown, recent win/loss streaks, volatility of your chosen pairs, and historical performance under similar conditions to provide a dynamic risk assessment. It might suggest reducing position sizes during a losing streak, or highlight that your risk per trade has been creeping up without you noticing. It can score your overall risk profile on a scale and track it over time, giving you a concrete measure of whether you are becoming more or less disciplined.
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">Think of it this way:</span> A traditional journal tells you what happened. An AI journal tells you what happened, why it happened, what is likely to happen next, and what you should do about it.
            </p>
          </LandingGlassCard>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            The Copilot Approach: Chat With Your Data
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Perhaps the most exciting development in AI-powered trading journals is the ability to have a conversation with your data. Instead of building complex filters, writing formulas, or creating pivot tables, you can simply ask a question in natural language.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            &quot;What was my best performing pair last month?&quot; &quot;How do my Monday trades compare to my Friday trades?&quot; &quot;Show me my performance when I trade during high-impact news events.&quot; &quot;What would my results look like if I had cut my losses at 1% instead of 2%?&quot;
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            This conversational interface democratizes data analysis. You do not need to know SQL, Python, or advanced Excel formulas. You just need to be curious about your own performance. The AI copilot becomes a personal trading coach that knows every single trade you have ever taken and can recall and analyze any of them instantly.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            The shift from static journals to AI-powered analysis platforms represents the biggest leap forward in retail trading tools in over a decade. Traders who adopt these tools early gain a significant edge, not because the AI trades for them, but because it helps them understand themselves better. And in trading, self-knowledge is the ultimate edge.
          </p>
        </article>
      </LandingSectionWrapper>

      {/* CTA */}
      <LandingSectionWrapper className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 p-8 sm:p-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              {t("landing.blogCta")}
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              {t("landing.blogCtaSubtitle")}
            </p>
            <LandingGradientButton href={`${appUrl}/register`} size="lg">
              {t("landing.ctaStart")}
            </LandingGradientButton>
          </div>
        </div>
      </LandingSectionWrapper>

      <LandingFooter />
    </div>
  )
}
