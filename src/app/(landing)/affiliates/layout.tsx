import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Affiliate Program — Earn 15% Recurring Commission | Trade AI Hub",
  description:
    "Join the Trade AI Hub Affiliate Program. Earn 15% recurring commissions on every referral payment. Paid in crypto (USDT/USDC). Apply now and start earning.",
  openGraph: {
    title: "Trade AI Hub Affiliate Program — 15% Recurring Commission",
    description:
      "Promote Trade AI Hub and earn 15% recurring commissions paid in crypto. No cost to join, no cap on earnings. Apply to become a partner today.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trade AI Hub Affiliate Program — 15% Recurring Commission",
    description:
      "Earn 15% recurring commissions promoting Trade AI Hub. Paid in crypto, no cap on earnings.",
  },
  alternates: {
    canonical: "https://tradeaihub.com/affiliates",
  },
}

export default function AffiliatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
