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

export default function MetricsArticlePage() {
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
          <div className="mb-6 h-48 sm:h-64 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 opacity-80" />
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Feb 20, 2026
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              8 {t("landing.blogMinRead")}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            {t("landing.blogArticle1Title")}
          </h1>
        </div>
      </LandingSectionWrapper>

      {/* Article Body */}
      <LandingSectionWrapper className="px-4 pb-16 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-3xl">
          <p className="text-gray-300 leading-relaxed mb-4">
            Ask most forex traders how they measure success and you will hear the same answer: &quot;Am I making money or not?&quot; While profit and loss is obviously the bottom line, focusing exclusively on your P&amp;L is like driving a car while only watching the speedometer. You might know how fast you are going, but you have no idea if the engine is overheating, the fuel is running low, or the brakes are failing. To truly understand your trading performance and build a sustainable edge, you need to track the metrics that reveal what is happening beneath the surface.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            In this article, we break down five essential metrics that every serious forex trader should monitor. These are the numbers that professional traders and prop firms track religiously, and they can make the difference between a trader who survives and one who thrives.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            1. Win Rate
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Your win rate is the percentage of trades that close in profit out of your total number of trades. If you take 100 trades and 55 are winners, your win rate is 55%. Simple enough. But here is where most traders get it wrong: they assume a high win rate equals profitability.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            The truth is, a 40% win rate can be extremely profitable if your winners are significantly larger than your losers. Many successful trend-following strategies operate with win rates below 50%, catching a few large moves that more than compensate for the smaller, frequent losses. Conversely, a 70% win rate means nothing if your average loss is three times your average win.
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">How to calculate:</span> Win Rate = (Number of Winning Trades / Total Trades) x 100. Track this monthly and compare it across different strategies, pairs, and market conditions.
            </p>
          </LandingGlassCard>
          <p className="text-gray-300 leading-relaxed mb-4">
            The key insight is that win rate is meaningless in isolation. It must always be evaluated alongside your risk-reward ratio and average win versus average loss. A scalper might have a 75% win rate with a 1:0.5 risk-reward, while a swing trader might have a 35% win rate with a 1:4 risk-reward. Both can be profitable. What matters is the combination.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            2. Risk-Reward Ratio
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            The risk-reward ratio (RRR) measures how much you stand to gain relative to how much you are risking on each trade. A 1:2 risk-reward means you are risking $100 to potentially make $200. A 1:3 means risking $100 to make $300.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            Why does aiming for at least 1:2 change everything? Because it gives you a mathematical cushion. With a 1:2 risk-reward, you only need to win 34% of your trades to break even. At 1:3, you only need 25%. This completely shifts the psychological burden. You no longer need to be right most of the time. You just need to let your winners run and cut your losers short, which is the oldest and most powerful trading wisdom there is.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            Consider this example: Trader A takes 100 trades with a 1:1 risk-reward and a 55% win rate. They make 55 x $100 = $5,500 and lose 45 x $100 = $4,500. Net profit: $1,000. Trader B takes 100 trades with a 1:2 risk-reward and a 40% win rate. They make 40 x $200 = $8,000 and lose 60 x $100 = $6,000. Net profit: $2,000. Trader B wins less often but makes twice as much money.
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">Pro tip:</span> Always set your take-profit before entering a trade. If you cannot find a setup with at least 1:1.5 risk-reward, skip it. The best setups will come, and your patience will be rewarded.
            </p>
          </LandingGlassCard>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            3. Profit Factor
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Profit factor is one of the most powerful yet underused metrics in retail trading. It is calculated by dividing your gross profits by your gross losses. A profit factor of 1.0 means you are breaking even. Above 1.0 means you are profitable. Below 1.0 means you are losing money.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            What makes profit factor so valuable is that it combines win rate and risk-reward into a single number that tells you whether you have a real edge. Professional traders and hedge funds typically look for a profit factor of at least 1.5, and anything above 2.0 is considered excellent. If your profit factor drops below 1.2, it is a warning sign that your edge is thin and could disappear with a few bad trades.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 mb-6 ml-4">
            <li><span className="font-semibold text-white">Below 1.0:</span> You are losing money. Stop trading and review your strategy.</li>
            <li><span className="font-semibold text-white">1.0 to 1.5:</span> Marginal edge. Fees and slippage could eat your profits.</li>
            <li><span className="font-semibold text-white">1.5 to 2.0:</span> Solid edge. Your strategy is working, keep optimizing.</li>
            <li><span className="font-semibold text-white">Above 2.0:</span> Strong edge. Focus on consistency and risk management.</li>
          </ul>
          <p className="text-gray-300 leading-relaxed mb-4">
            Track your profit factor monthly and across different strategies. If you run multiple strategies, profit factor instantly tells you which ones are carrying the portfolio and which ones are dragging it down.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            4. Maximum Drawdown
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Maximum drawdown measures the largest peak-to-trough decline in your account balance. If your account grew from $10,000 to $15,000 and then dropped to $12,000 before recovering, your maximum drawdown was $3,000 or 20% from the peak.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            This metric matters for two critical reasons. First, it tells you your worst-case scenario. If you have experienced a 30% drawdown in the past, you should expect it to happen again, and probably worse. Your position sizing and risk management should account for this. If a 30% drawdown would cause you to panic and abandon your strategy, you are trading too large.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            Second, drawdown has a non-linear relationship with recovery. A 10% drawdown requires an 11% gain to recover. A 20% drawdown requires 25%. A 50% drawdown requires 100%, doubling your remaining capital just to get back to break even. This is why capital preservation is not just important, it is everything. The traders who survive long enough to compound their gains are the ones who keep their drawdowns manageable.
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">Rule of thumb:</span> If your maximum drawdown exceeds 20% of your account, reduce your position sizes immediately. Most prop firms set a maximum drawdown limit of 10% to 12% for a reason.
            </p>
          </LandingGlassCard>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            5. Expectancy
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Expectancy is arguably the single most important metric for a trader because it tells you the average amount you can expect to make (or lose) per trade over the long run. It combines your win rate, average win, and average loss into one definitive number.
          </p>
          <LandingGlassCard className="p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">Formula:</span> Expectancy = (Win Rate x Average Win) - (Loss Rate x Average Loss). For example, if you win 45% of the time with an average win of $250 and lose 55% of the time with an average loss of $150, your expectancy is (0.45 x $250) - (0.55 x $150) = $112.50 - $82.50 = <span className="font-semibold text-white">$30 per trade</span>.
            </p>
          </LandingGlassCard>
          <p className="text-gray-300 leading-relaxed mb-4">
            A positive expectancy means that, over a large enough sample of trades, you will make money. A negative expectancy means no amount of position sizing, money management, or psychological coaching will save you. The system itself is broken. This is why expectancy is the ultimate metric: it is the mathematical proof that your strategy works.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            The caveat is sample size. You need at least 100 trades to get a reliable expectancy reading. Anything less and random variance can create a misleading picture. Track expectancy across your entire portfolio and for each individual strategy to see where your real edge lies.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">
            Bringing It All Together: The TakeZ Score
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Each of these five metrics tells part of the story. Win rate shows frequency. Risk-reward shows magnitude. Profit factor shows edge. Drawdown shows risk. Expectancy shows the mathematical outcome. The most powerful approach is to track all five simultaneously and understand how they interact.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            That is exactly what the TakeZ Score in Trade AI Hub does. It combines these metrics and more into a single composite score that gives you an instant read on your overall trading health. Instead of jumping between spreadsheets and manually calculating formulas, you get a real-time dashboard that updates automatically as you log trades. The AI agents even analyze trends in your metrics over time and alert you when something changes, whether it is an improvement to celebrate or a deterioration to investigate.
          </p>
        </article>
      </LandingSectionWrapper>

      {/* CTA */}
      <LandingSectionWrapper className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 p-8 sm:p-12 text-center">
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
