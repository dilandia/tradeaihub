"use client"

import { type ReactNode } from "react"

interface LandingGlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function LandingGlassCard({
  children,
  className = "",
  hover = false,
}: LandingGlassCardProps) {
  const baseClasses = [
    "bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl",
  ]

  if (hover) {
    baseClasses.push(
      "hover:bg-white/[0.06] hover:border-indigo-500/30",
      "hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]",
      "hover:-translate-y-1",
      "transition-all duration-300"
    )
  }

  baseClasses.push(className)

  return <div className={baseClasses.join(" ")}>{children}</div>
}
