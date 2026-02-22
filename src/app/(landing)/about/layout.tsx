import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Trade AI Hub — our mission to empower forex traders with AI-powered journaling, analytics, and performance tracking tools.",
  openGraph: {
    title: "About Us",
    description:
      "Learn about Trade AI Hub — our mission to empower forex traders with AI-powered journaling, analytics, and performance tracking tools.",
  },
  twitter: {
    title: "About Us",
    description:
      "Learn about Trade AI Hub — our mission to empower forex traders with AI-powered journaling, analytics, and performance tracking tools.",
  },
  alternates: {
    canonical: "https://tradeaihub.com/about",
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
