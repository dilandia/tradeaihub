import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "The Psychology of Successful Trading | Trade AI Hub Blog",
  description:
    "Learn how to overcome fear, greed, and emotional pitfalls in forex trading. Master trading psychology with practical frameworks for consistent profitability.",
  openGraph: {
    title: "The Psychology of Successful Trading",
    description:
      "Master trading psychology: overcome fear, greed, and emotional pitfalls with practical frameworks used by profitable forex traders.",
    type: "article",
    publishedTime: "2026-02-25T00:00:00Z",
    authors: ["Trade AI Hub"],
    tags: ["trading psychology", "forex mindset", "emotional trading", "discipline", "risk management"],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Psychology of Successful Trading",
    description:
      "Master trading psychology: overcome fear, greed, and emotional pitfalls for consistent profitability.",
  },
  alternates: {
    canonical: "https://tradeaihub.com/blog/the-psychology-of-successful-trading",
  },
}

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
