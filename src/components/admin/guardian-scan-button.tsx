"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Scan } from "lucide-react"

export function GuardianScanButton() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function runScan(type: "full" | "quick") {
    setScanning(true)
    setResult(null)

    try {
      const res = await fetch(`/api/admin/guardian?type=${type}`, {
        method: "POST",
      })
      const data = await res.json()

      if (data.success) {
        setResult(
          `${data.verdict} — ${data.total_checks} checks, ${data.events_found} events (${data.duration_ms}ms)`
        )
      } else {
        setResult(`Erro: ${data.error}`)
      }
    } catch {
      setResult("Falha na conexao")
    } finally {
      setScanning(false)
      // Refresh server component data
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-2">
      {result && (
        <span className="text-xs text-muted-foreground mr-1">{result}</span>
      )}
      <button
        onClick={() => runScan("quick")}
        disabled={scanning}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${scanning ? "animate-spin" : ""}`}
        />
        Quick
      </button>
      <button
        onClick={() => runScan("full")}
        disabled={scanning}
        className="inline-flex items-center gap-1.5 rounded-md border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20 disabled:opacity-50"
      >
        <Scan className={`h-3.5 w-3.5 ${scanning ? "animate-spin" : ""}`} />
        {scanning ? "Scanning..." : "Full Scan"}
      </button>
    </div>
  )
}
