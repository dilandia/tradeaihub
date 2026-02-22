"use client"

import { type ReactNode } from "react"

interface LandingGhostButtonProps {
  children: ReactNode
  href?: string
  onClick?: () => void
  className?: string
  size?: "default" | "lg"
}

export function LandingGhostButton({
  children,
  href,
  onClick,
  className = "",
  size = "default",
}: LandingGhostButtonProps) {
  const sizeClasses =
    size === "lg" ? "px-8 py-4 text-base" : "px-6 py-3 text-sm"

  const baseClasses = [
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium text-white",
    "border border-white/20",
    "hover:border-white/40 hover:bg-white/[0.05]",
    "transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    sizeClasses,
    className,
  ].join(" ")

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className={baseClasses}>
      {children}
    </button>
  )
}
