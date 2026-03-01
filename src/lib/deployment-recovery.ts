/**
 * Deployment Recovery — Auto-recovery para stale deployment errors
 *
 * Quando o PM2 crasha/reinicia ou um novo build é feito, os chunks JS
 * cacheados no browser referenciam Server Actions que não existem mais.
 * Este utilitário detecta esses erros e faz reload automático.
 *
 * Incidente de referência: 01-03-2026 (502 no app.tradeaihub.com)
 */

const STALE_DEPLOYMENT_PATTERNS = [
  /Failed to find Server Action/i,
  /ChunkLoadError/i,
  /Loading chunk .+ failed/i,
  /Loading CSS chunk .+ failed/i,
  /Unexpected token '<'/,
  /MIME type.*text\/html/i,
]

const RECOVERY_KEY = "__deployment_recovery"
const MAX_RETRIES = 2
const RETRY_WINDOW_MS = 30_000

export function isStaleDeploymentError(message: string): boolean {
  return STALE_DEPLOYMENT_PATTERNS.some((p) => p.test(message))
}

export function attemptAutoRecovery(): boolean {
  if (typeof window === "undefined") return false

  try {
    const now = Date.now()
    const stored = sessionStorage.getItem(RECOVERY_KEY)
    const data = stored ? JSON.parse(stored) : { count: 0, first: now }

    // Reset if outside retry window
    if (now - data.first > RETRY_WINDOW_MS) {
      data.count = 0
      data.first = now
    }

    // Max retries reached — let error boundary show
    if (data.count >= MAX_RETRIES) return false

    data.count++
    sessionStorage.setItem(RECOVERY_KEY, JSON.stringify(data))

    // Clear all caches (Cache API — removes stale chunks)
    if ("caches" in window) {
      caches.keys().then((names) => names.forEach((name) => caches.delete(name)))
    }

    // Force full reload bypassing browser cache
    window.location.reload()
    return true
  } catch {
    // sessionStorage blocked or other error — skip recovery
    return false
  }
}

export function forceHardRefresh(): void {
  if ("caches" in window) {
    caches.keys().then((names) => names.forEach((name) => caches.delete(name)))
  }
  window.location.href = window.location.href
}
