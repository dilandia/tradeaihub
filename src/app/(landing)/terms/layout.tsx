import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Trade AI Hub terms of service — the rules and guidelines governing the use of our AI-powered trading journal platform.",
  alternates: {
    canonical: "https://tradeaihub.com/terms",
  },
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
