import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Trading Blog: Forex Tips, AI Analytics & Performance Insights",
  description:
    "Trading insights, forex strategies, and AI analytics tips from Trade AI Hub. Learn how to track metrics, manage risk, and optimize your trading performance.",
  openGraph: {
    title: "Trading Blog — Forex Tips & AI Analytics | Trade AI Hub",
    description:
      "Trading insights, forex strategies, and AI analytics tips. Learn how to track metrics, manage risk, and optimize your trading performance.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trading Blog — Forex Tips & AI Analytics | Trade AI Hub",
    description:
      "Trading insights, forex strategies, and AI analytics tips from Trade AI Hub.",
  },
  alternates: {
    canonical: "https://tradeaihub.com/blog",
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
