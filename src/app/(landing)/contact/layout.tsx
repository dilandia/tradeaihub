import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Trade AI Hub team. We are here to help with support, partnerships, and feedback.",
  alternates: {
    canonical: "https://tradeaihub.com/contact",
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
