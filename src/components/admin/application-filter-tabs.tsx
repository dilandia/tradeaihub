"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ClipboardList, Clock, CheckCircle2, XCircle, List } from "lucide-react"

const STATUSES = [
  { value: "pending", label: "Pending", icon: Clock, color: "text-amber-400" },
  { value: "approved", label: "Approved", icon: CheckCircle2, color: "text-emerald-400" },
  { value: "rejected", label: "Rejected", icon: XCircle, color: "text-red-400" },
  { value: "all", label: "All", icon: List, color: "text-muted-foreground" },
] as const

interface Props {
  currentFilter: string
  counts: { pending: number; approved: number; rejected: number; all: number }
}

export function ApplicationFilterTabs({ currentFilter, counts }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "pending") {
      params.delete("appStatus")
    } else {
      params.set("appStatus", value)
    }
    router.push(`/admin/affiliates?${params.toString()}`)
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {STATUSES.map(({ value, label, icon: Icon, color }) => {
        const isActive = currentFilter === value
        const count = counts[value as keyof typeof counts]
        return (
          <button
            key={value}
            onClick={() => handleFilter(value)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
            }`}
          >
            <Icon className={`h-3 w-3 ${isActive ? "text-indigo-400" : color}`} />
            {label}
            {count > 0 && (
              <span className={`rounded-full px-1.5 py-0 text-[10px] font-bold ${
                isActive ? "bg-indigo-500/30" : "bg-muted"
              }`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
