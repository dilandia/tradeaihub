import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Trade AI Hub privacy policy — how we collect, use, and protect your trading data and personal information.",
  alternates: {
    canonical: "https://tradeaihub.com/privacy",
  },
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
