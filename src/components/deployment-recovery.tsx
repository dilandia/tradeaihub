"use client"

import { useEffect } from "react"
import { isStaleDeploymentError, attemptAutoRecovery } from "@/lib/deployment-recovery"

/**
 * Global listener for stale deployment errors.
 * Catches ChunkLoadError, Server Action mismatch, etc.
 * and auto-reloads the page to fetch fresh bundles.
 *
 * Mount once in root layout.
 */
export function DeploymentRecovery() {
  useEffect(() => {
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
    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleRejection)
    }
  }, [])

  return null
}
