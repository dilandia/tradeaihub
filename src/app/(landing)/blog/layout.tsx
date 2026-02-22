import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Trading insights, forex strategies, and AI analytics tips from Trade AI Hub. Stay updated with the latest in trading performance optimization.",
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
