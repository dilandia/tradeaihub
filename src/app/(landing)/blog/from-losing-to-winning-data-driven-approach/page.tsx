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

export default function DataDrivenArticlePage() {
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
          <div className="mb-6 h-48 sm:h-64 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-500 opacity-80" />
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Feb 15, 2026
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              9 {t("landing.blogMinRead")}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            {t("landing.blogArticle3Title")}
          </h1>
        </div>
      </LandingSectionWrapper>

      {/* Article Body */}
      <LandingSectionWrapper className="px-4 pb-16 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-3xl">
          <p className="text-gray-300 leading-relaxed mb-4">
            There is a statistic that gets repeated so often in trading circles that it has become almost cliche: 90% of retail traders lose money. Some studies put the number even higher. But instead of accepting this as an inevitable reality, it is more productive to ask a different question: what do the 10% who win do differently? The answer, across nearly every study and interview with consistently profitable traders, comes back to one thing. Data.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            Winning traders do not rely on gut feelings, hot tips, or the latest indicator. They treat trading as a business and their trade history as the most important business intelligence they have. They track everything, analyze relentlessly, and make decisions based on evidence rather than emotion. This article lays out a five-step framework for making that transformation.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            Step 1: Start Tracking Everything
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            The first step is deceptively simple but critically important: record every single trade you take. Not just the winners, not just the big trades, every single one. Import your MT4 or MT5 history. Connect your broker. Leave no trade undocumented.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            But raw trade data is just the beginning. The real power comes from adding context. Tag each trade with the strategy you used: was it a breakout, a pullback, a range trade, a news play? Add notes about market conditions. Were you trading during a trending market or a choppy one? Was there a major news event? Were you feeling confident or anxious?
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            This enriched data becomes the foundation for everything that follows. Without it, you are trying to diagnose a problem without any symptoms. Most traders resist this step because it forces accountability. It is much easier to forget about losing trades than to look at them documented in detail. But that discomfort is exactly where growth begins.
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">Getting started:</span> Import at least 3 months of trade history to establish a baseline. Tag every trade with a strategy name and at least one contextual tag. The more data you provide, the more meaningful your analysis becomes.
            </p>
          </LandingGlassCard>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            Step 2: Identify Your Patterns
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Once you have at least 50 to 100 tracked trades, patterns will start to emerge. Some will confirm what you already suspected. Others will surprise you. Both are valuable.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            Start by breaking down your performance across different dimensions. Which currency pairs are you most profitable on? Most traders have two or three pairs where they consistently perform well and several where they consistently underperform. Look at time of day. Many traders find that their best results come during one specific session, and their worst results come when they trade outside their sweet spot.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            Examine your strategies. If you trade multiple setups, compare their individual metrics. You might discover that your breakout trades have a 60% win rate with a 1:3 risk-reward, while your counter-trend trades have a 35% win rate with a 1:1.5 risk-reward. The data makes it obvious which one to focus on, even though both might feel equally good in the moment.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 mb-6 ml-4">
            <li>Performance by currency pair: find your best and worst pairs</li>
            <li>Performance by time of day and trading session</li>
            <li>Performance by strategy or setup type</li>
            <li>Performance by day of week</li>
            <li>Performance by trade duration (scalps vs. swings)</li>
            <li>Performance by direction (long vs. short bias)</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            Step 3: Eliminate Losing Behaviors
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            This is where the transformation truly begins. Once you have identified your patterns, the next step is to systematically eliminate the behaviors that are costing you money. This is not about finding new strategies or learning new indicators. It is about stopping the things that are already proven, by your own data, to lose.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            The most common losing behaviors in forex trading are well known. Revenge trading: taking impulsive trades after a loss to &quot;make it back.&quot; The data typically shows that trades taken within 30 minutes of a losing trade have dramatically lower win rates. Overtrading: taking too many trades per session, diluting your edge with low-quality setups. Moving stop-losses: adjusting your stop further from entry to avoid being stopped out, which turns small manageable losses into account-threatening ones. Trading the wrong sessions: forcing trades during low-volatility periods when your strategy requires momentum.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            The key is to quantify these behaviors. Do not just say &quot;I think I overtrade.&quot; Calculate your win rate and profit factor when you take more than 5 trades per day versus fewer than 5. Do not just suspect that revenge trading hurts you. Measure the performance of trades taken within 30 minutes of a loss versus trades taken with a clean slate. When the numbers are in front of you, the path forward becomes clear.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            Step 4: Double Down on What Works
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Most traders spend all their energy trying to fix weaknesses. While eliminating losing behaviors is essential, the other half of the equation is equally important: do more of what is already working. This is where the data becomes your biggest ally.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            If your data shows that EUR/USD breakout trades during the London-New York overlap have a profit factor of 2.5, that is your edge. Lean into it. Trade that setup more frequently. Refine your entry and exit criteria for it. Consider increasing your position size slightly, within your risk parameters, when that specific setup presents itself.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            Conversely, if your data shows that your counter-trend GBP/JPY trades have a profit factor of 0.8, stop taking them. It does not matter how good they feel in the moment or how many YouTube videos say it is a great strategy. Your data says it does not work for you, and your data is the only opinion that matters.
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">The 80/20 rule in trading:</span> For most traders, 20% of their setups produce 80% of their profits. Finding and focusing on that 20% is the fastest path to consistent profitability.
            </p>
          </LandingGlassCard>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            Step 5: Review Weekly
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Improvement is not a one-time event. It is a continuous process that requires regular review. The most effective cadence for most traders is a weekly review, with a deeper monthly analysis.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            Your weekly review should answer three questions: What went right this week? What went wrong? What will I do differently next week? Keep it focused and action-oriented. Do not spend two hours reliving every trade. Spend 30 minutes looking at the data, identifying one thing to improve, and committing to that change for the following week.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            Monthly reviews should zoom out further. Look at how your key metrics have trended over the past 30 days. Is your win rate improving or declining? Is your drawdown growing? Has your profit factor changed? AI-generated weekly and monthly reports automate this process, surfacing the trends and changes that matter most so you can focus on making decisions rather than crunching numbers.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            A Real-World Transformation
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Consider the journey of a trader who was consistently losing 12% of their account per month. After three months of dedicated journaling and data analysis, the pattern became clear. They were taking 15 to 20 trades per day, well beyond the optimal range for their strategy. Their revenge trading after losses was severe, with 40% of their trades coming within minutes of a losing trade. And they were trading five different currency pairs, despite being consistently profitable on only two of them.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            The fix was not a new strategy or indicator. It was discipline backed by data. They limited themselves to a maximum of 6 trades per day. They implemented a mandatory 30-minute cooldown after any losing trade. They narrowed their focus to EUR/USD and GBP/USD exclusively. Within two months, they went from -12% per month to +4% per month. Not because they became a better analyst, but because they stopped doing the things that were costing them money.
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">The takeaway:</span> The path from losing to winning is rarely about adding something new. It is about removing the habits, the pairs, the sessions, and the emotional patterns that your data proves are working against you. Your trade history already contains the answers. You just need the tools to find them.
            </p>
          </LandingGlassCard>
        </article>
      </LandingSectionWrapper>

      {/* CTA */}
      <LandingSectionWrapper className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 border border-fuchsia-500/20 p-8 sm:p-12 text-center">
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
