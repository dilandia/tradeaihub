"use client"

interface LandingSectionHeaderProps {
  label?: string
  title: string
  subtitle?: string
  className?: string
  align?: "center" | "left"
}

export function LandingSectionHeader({
  label,
  title,
  subtitle,
  className = "",
  align = "center",
}: LandingSectionHeaderProps) {
  const alignCenter = align === "center"

  return (
    <div className={`${alignCenter ? "text-center" : ""} ${className}`}>
      {label && (
        <p
          className={`inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-400 ${alignCenter ? "mx-auto" : ""}`}
        >
          {label}
        </p>
      )}
      <h2
        className={`${label ? "mt-4" : ""} text-3xl font-bold text-white sm:text-4xl`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 text-lg text-slate-400 leading-relaxed ${alignCenter ? "mx-auto max-w-2xl" : "max-w-2xl"}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
