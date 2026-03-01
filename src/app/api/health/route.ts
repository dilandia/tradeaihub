import { NextResponse } from "next/server"
import { getBuildId } from "@/lib/build-id"

const START_TIME = Date.now()

export const dynamic = "force-dynamic"

export async function GET() {
  const uptimeMs = Date.now() - START_TIME
  const mem = process.memoryUsage()

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: formatUptime(uptimeMs),
      buildId: getBuildId(),
      memory: {
        rss: formatMB(mem.rss),
        heapUsed: formatMB(mem.heapUsed),
        heapTotal: formatMB(mem.heapTotal),
      },
      node: process.version,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "x-build-id": getBuildId(),
      },
    }
  )
}

function formatMB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h}h ${m}m ${s % 60}s`
}
