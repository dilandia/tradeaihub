import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Position Sizing Explained | Trade AI Hub",
  description: "Master the 2% rule and learn how to size your positions correctly. Protect your trading capital and achieve consistent returns.",
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
