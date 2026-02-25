import { Metadata } from "next"

export const metadata: Metadata = {
  title: "The Psychology of Successful Trading | Trade AI Hub",
  description: "Learn how to overcome fear, greed, and emotional pitfalls in forex trading. Master trading psychology for consistent profitability.",
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
