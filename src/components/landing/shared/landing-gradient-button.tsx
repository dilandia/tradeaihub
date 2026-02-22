"use client"

import { type ReactNode } from "react"

interface LandingGradientButtonProps {
  children: ReactNode
  href?: string
  onClick?: () => void
  className?: string
  size?: "default" | "lg"
}

export function LandingGradientButton({
  children,
  href,
  onClick,
  className = "",
  size = "default",
}: LandingGradientButtonProps) {
  const sizeClasses =
    size === "lg" ? "px-8 py-4 text-base" : "px-6 py-3 text-sm"

  const baseClasses = [
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-white",
    "bg-gradient-to-r from-indigo-500 to-violet-500",
    "hover:from-indigo-400 hover:to-violet-400",
    "shadow-lg shadow-indigo-500/25",
    "hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/30",
    "transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
