import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "From Losing to Winning: A Data-Driven Approach | Trade AI Hub Blog",
  description:
    "90% of retail traders lose money. Learn the 5-step data-driven framework that winning traders use to identify patterns, eliminate bad habits, and scale their edge.",
  openGraph: {
    title: "From Losing to Winning: A Data-Driven Approach",
    description:
      "90% of retail traders lose money. Learn the 5-step data-driven framework that winning traders use to turn their trading around with data and journaling.",
    type: "article",
    publishedTime: "2026-02-15T00:00:00Z",
    authors: ["Trade AI Hub"],
    tags: ["forex", "trading psychology", "data-driven trading", "trading journal"],
  },
  twitter: {
    card: "summary_large_image",
    title: "From Losing to Winning: A Data-Driven Approach",
    description:
      "90% of retail traders lose money. Learn the 5-step data-driven framework that winning traders use.",
  },
  alternates: {
    canonical: "https://tradeaihub.com/blog/from-losing-to-winning-data-driven-approach",
  },
}

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
