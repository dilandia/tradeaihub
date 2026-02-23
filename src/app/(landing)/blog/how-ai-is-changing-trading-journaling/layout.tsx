import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "How AI is Changing Trading Journaling | Trade AI Hub Blog",
  description:
    "Learn how artificial intelligence is transforming trading journals with pattern recognition, behavioral analysis, automated insights, and AI copilot features.",
  openGraph: {
    title: "How AI is Changing Trading Journaling",
    description:
      "From pattern recognition to behavioral analysis, discover how AI-powered trading journals are replacing spreadsheets and giving traders an unprecedented edge.",
    type: "article",
    publishedTime: "2026-02-18T00:00:00Z",
    authors: ["Trade AI Hub"],
    tags: ["AI", "trading journal", "pattern recognition", "trading copilot"],
  },
  twitter: {
    card: "summary_large_image",
    title: "How AI is Changing Trading Journaling",
    description:
      "From pattern recognition to behavioral analysis, discover how AI-powered trading journals are replacing spreadsheets.",
  },
  alternates: {
    canonical: "https://tradeaihub.com/blog/how-ai-is-changing-trading-journaling",
  },
}

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
