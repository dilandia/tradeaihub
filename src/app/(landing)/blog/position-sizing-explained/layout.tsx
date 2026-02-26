import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Position Sizing Explained: The 2% Rule & Beyond | Trade AI Hub Blog",
  description:
    "Master the 2% rule and learn how to size your positions correctly. Protect your trading capital with proven position sizing strategies for forex traders.",
  openGraph: {
    title: "Position Sizing Explained: The 2% Rule & Beyond",
    description:
      "Learn proven position sizing strategies to protect your capital. From the 2% rule to Kelly Criterion — master risk management for forex trading.",
    type: "article",
    publishedTime: "2026-02-25T00:00:00Z",
    authors: ["Trade AI Hub"],
    tags: ["position sizing", "2% rule", "risk management", "forex", "money management"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Position Sizing Explained: The 2% Rule & Beyond",
    description:
      "Master position sizing strategies to protect your trading capital and achieve consistent returns.",
  },
  alternates: {
    canonical: "https://tradeaihub.com/blog/position-sizing-explained",
  },
}

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
