"use client"

import { useEffect } from "react"
import {
  isStaleDeploymentError,
  attemptAutoRecovery,
  storeBuildId,
  checkBuildVersion,
} from "@/lib/deployment-recovery"
import { getSession } from "@/lib/auth-client"

/**
 * Global listener for stale deployment errors + build version monitor + session check.
 *
 * Layer 1: Catches ChunkLoadError, Server Action mismatch → auto-reload
 * Layer 2: On tab focus, checks auth session (Better Auth handles refresh automatically)
 *          + checks build version
 * Layer 3: On mount, stores current build ID for future comparisons
 *
 * Mount once in root layout.
 */
export function DeploymentRecovery() {
  useEffect(() => {
    // Layer 1: Error listeners
    const handleError = (event: ErrorEvent) => {
      if (isStaleDeploymentError(event.message || "")) {
        event.preventDefault()
        attemptAutoRecovery()
      }
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || String(event.reason || "")
      if (isStaleDeploymentError(msg)) {
        event.preventDefault()
        attemptAutoRecovery()
      }
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleRejection)

    // Layer 2: Session check + build version check on tab focus
    // Better Auth handles token refresh automatically via its session management
    let lastCheck = 0
    const MIN_CHECK_INTERVAL = 60_000 // Don't check more than once per minute

    const handleVisibility = async () => {
      if (document.visibilityState !== "visible") return
      const now = Date.now()
      if (now - lastCheck < MIN_CHECK_INTERVAL) return
      lastCheck = now

      // Step 1: Verify session is still valid
      // Better Auth refreshes tokens automatically — we only redirect if there's no session
      try {
        const { data, error } = await getSession()
        if (error || !data?.session) {
          // Session unrecoverable — redirect to login cleanly
          window.location.href = "/login"
          return
        }
      } catch {
        // Network error — skip silently,
        // user will hit the error on next interaction anyway
      }

      // Step 2: Check build version (existing behavior)
      checkBuildVersion()
    }

    document.addEventListener("visibilitychange", handleVisibility)

    // Layer 3: Store initial build ID from the page's meta tag
    const buildMeta = document.querySelector('meta[name="x-build-id"]')
    if (buildMeta) {
      storeBuildId(buildMeta.getAttribute("content") || "")
    }

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleRejection)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  return null
}
