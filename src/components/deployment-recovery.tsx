"use client"

import { useEffect, useRef } from "react"
import {
  isStaleDeploymentError,
  attemptAutoRecovery,
  storeBuildId,
  checkBuildVersion,
} from "@/lib/deployment-recovery"
import { createClient } from "@/lib/supabase/client"

import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Global listener for stale deployment errors + build version monitor + session refresh.
 *
 * Layer 1: Catches ChunkLoadError, Server Action mismatch → auto-reload
 * Layer 2: On tab focus, refreshes auth session (prevents 502 after idle) + checks build version
 * Layer 3: On mount, stores current build ID for future comparisons
 *
 * Mount once in root layout.
 */
export function DeploymentRecovery() {
  const supabaseRef = useRef<SupabaseClient | null>(null)

  useEffect(() => {
    // Lazily create a single supabase client for this component's lifetime
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    const supabase = supabaseRef.current

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

    // Layer 2: Session refresh + build version check on tab focus
    let lastCheck = 0
    const MIN_CHECK_INTERVAL = 60_000 // Don't check more than once per minute

    const handleVisibility = async () => {
      if (document.visibilityState !== "visible") return
      const now = Date.now()
      if (now - lastCheck < MIN_CHECK_INTERVAL) return
      lastCheck = now

      // Step 1: Refresh auth session before any API calls
      // This prevents 502s when JWT expired during idle (mobile tab switch, sleep)
      try {
        const { error } = await supabase.auth.getSession()
        if (error) {
          // Session unrecoverable — redirect to login cleanly
          window.location.href = "/login"
          return
        }
      } catch {
        // Network error or supabase unreachable — skip silently,
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
