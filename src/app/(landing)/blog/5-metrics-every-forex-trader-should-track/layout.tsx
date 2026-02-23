import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "5 Metrics Every Forex Trader Should Track | Trade AI Hub Blog",
  description:
    "Discover the 5 essential trading metrics — win rate, risk-reward ratio, profit factor, maximum drawdown, and expectancy — that separate profitable forex traders from the rest.",
  openGraph: {
    title: "5 Metrics Every Forex Trader Should Track",
    description:
      "Discover the 5 essential trading metrics that separate profitable forex traders from the rest. Learn how to calculate and track win rate, risk-reward ratio, profit factor, drawdown, and expectancy.",
    type: "article",
    publishedTime: "2026-02-20T00:00:00Z",
    authors: ["Trade AI Hub"],
    tags: ["forex", "trading metrics", "win rate", "risk-reward", "profit factor"],
  },
  twitter: {
    card: "summary_large_image",
    title: "5 Metrics Every Forex Trader Should Track",
    description:
      "Discover the 5 essential trading metrics that separate profitable forex traders from the rest.",
  },
  alternates: {
    canonical: "https://tradeaihub.com/blog/5-metrics-every-forex-trader-should-track",
  },
}

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
