/**
 * Deployment Recovery — Auto-recovery para stale deployment errors
 *
 * 3 camadas de proteção:
 * 1. Error detection — catches ChunkLoadError, Server Action mismatch, etc.
 * 2. Build version check — detects new deploy via x-build-id header on tab focus
 * 3. Cache purge — clears Cache API + forces hard reload
 *
 * Incidentes de referência:
 * - 01-03-2026: 502 no app.tradeaihub.com (Node 20 transformAlgorithm bug)
 * - 01-03-2026: Cookies stale após deploy causavam 502 persistente
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
const BUILD_ID_KEY = "__build_id"
const MAX_RETRIES = 2
const RETRY_WINDOW_MS = 30_000

export function isStaleDeploymentError(message: string): boolean {
  return STALE_DEPLOYMENT_PATTERNS.some((p) => p.test(message))
}

/**
 * Store the current build ID from the server response.
 * Called by DeploymentRecovery on mount.
 */
export function storeBuildId(buildId: string): void {
  if (typeof window === "undefined" || !buildId) return
  try {
    const existing = localStorage.getItem(BUILD_ID_KEY)
    if (existing && existing !== buildId) {
      // New deploy detected — purge caches and reload
      console.info("[DeploymentRecovery] New build detected, refreshing:", buildId)
      purgeAndReload()
      return
    }
    localStorage.setItem(BUILD_ID_KEY, buildId)
  } catch {
    // localStorage blocked
  }
}

/**
 * Check if the server has a newer build by fetching /api/health.
 * Called on tab focus / visibility change.
 */
export async function checkBuildVersion(): Promise<boolean> {
  if (typeof window === "undefined") return false
  try {
    const res = await fetch("/api/health", { cache: "no-store" })
    const serverBuildId = res.headers.get("x-build-id")
    if (!serverBuildId) return false

    const localBuildId = localStorage.getItem(BUILD_ID_KEY)
    if (localBuildId && localBuildId !== serverBuildId) {
      console.info("[DeploymentRecovery] Build mismatch on focus check, refreshing")
      purgeAndReload()
      return true
    }
    // Update stored ID in case it was missing
    localStorage.setItem(BUILD_ID_KEY, serverBuildId)
    return false
  } catch {
    return false
  }
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

    purgeAndReload()
    return true
  } catch {
    // sessionStorage blocked or other error — skip recovery
    return false
  }
}

/**
 * Purge all caches and force a hard reload.
 */
function purgeAndReload(): void {
  // Clear Cache API (removes stale chunks)
  if ("caches" in window) {
    caches.keys().then((names) => names.forEach((name) => caches.delete(name)))
  }
  // Force full reload bypassing browser cache
  window.location.reload()
}

export function forceHardRefresh(): void {
  // Also clear the stored build ID so it re-fetches
  try { localStorage.removeItem(BUILD_ID_KEY) } catch { /* */ }
  purgeAndReload()
}
