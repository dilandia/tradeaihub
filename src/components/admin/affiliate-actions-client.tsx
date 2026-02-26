"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2, ToggleLeft, ToggleRight } from "lucide-react"
import {
  approveApplication,
  rejectApplication,
  toggleAffiliateStatus,
  processWithdrawal,
  rejectWithdrawal,
} from "@/app/actions/admin-affiliates"

interface Props {
  type: "application" | "withdrawal" | "affiliate"
  applicationId?: string
  withdrawalId?: string
  affiliateId?: string
  affiliateIsActive?: boolean
}

export function AffiliateActionsClient({
  type,
  applicationId,
  withdrawalId,
  affiliateId,
  affiliateIsActive,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [txHash, setTxHash] = useState("")
  const [showReject, setShowReject] = useState(false)
  const [showProcess, setShowProcess] = useState(false)
  const [error, setError] = useState("")

  async function handleApprove() {
    if (!applicationId) return
    setLoading("approve")
    setError("")
    const result = await approveApplication(applicationId)
    setLoading(null)
    if (result.success) {
      router.refresh()
    } else {
      setError(result.error ?? "Error")
    }
  }

  async function handleRejectApp() {
    if (!applicationId) return
    setLoading("reject")
    setError("")
    const result = await rejectApplication(applicationId, rejectReason)
    setLoading(null)
    if (result.success) {
      router.refresh()
    } else {
      setError(result.error ?? "Error")
    }
  }

  async function handleToggle() {
    if (!affiliateId) return
    setLoading("toggle")
    setError("")
    const result = await toggleAffiliateStatus(affiliateId)
    setLoading(null)
    if (result.success) {
      router.refresh()
    } else {
      setError(result.error ?? "Error")
    }
  }

  async function handleProcessWithdrawal() {
    if (!withdrawalId) return
    setLoading("process")
    setError("")
    const result = await processWithdrawal(withdrawalId, txHash)
    setLoading(null)
    if (result.success) {
      router.refresh()
    } else {
      setError(result.error ?? "Error")
    }
  }

  async function handleRejectWithdrawal() {
    if (!withdrawalId) return
    setLoading("reject_w")
    setError("")
    const result = await rejectWithdrawal(withdrawalId, rejectReason)
    setLoading(null)
    if (result.success) {
      router.refresh()
    } else {
      setError(result.error ?? "Error")
    }
  }

  const btnClass = "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"

  if (type === "application") {
    return (
      <div className="space-y-2">
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleApprove}
            disabled={!!loading}
            className={`${btnClass} bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30`}
          >
            {loading === "approve" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            Approve
          </button>
          <button
            onClick={() => { setShowReject((v) => !v); setError(""); setRejectReason(""); }}
            disabled={!!loading}
            className={`${btnClass} bg-red-500/20 text-red-400 hover:bg-red-500/30`}
          >
            <XCircle className="h-3 w-3" />
            Reject
          </button>
        </div>
        {showReject && (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Rejection reason (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleRejectApp}
              disabled={!!loading}
              className={`${btnClass} bg-red-500/20 text-red-400 hover:bg-red-500/30`}
            >
              {loading === "reject" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
            </button>
          </div>
        )}
      </div>
    )
  }

  if (type === "withdrawal") {
    return (
      <div className="space-y-2">
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setShowProcess((v) => !v); setError(""); setTxHash(""); }}
            disabled={!!loading}
            className={`${btnClass} bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30`}
          >
            <CheckCircle2 className="h-3 w-3" />
            Mark as Paid
          </button>
          <button
            onClick={() => { setShowReject((v) => !v); setError(""); setRejectReason(""); }}
            disabled={!!loading}
            className={`${btnClass} bg-red-500/20 text-red-400 hover:bg-red-500/30`}
          >
            <XCircle className="h-3 w-3" />
            Reject
          </button>
        </div>
        {showProcess && (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Transaction hash (required)"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleProcessWithdrawal}
              disabled={!!loading || !txHash.trim()}
              className={`${btnClass} bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30`}
            >
              {loading === "process" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
            </button>
          </div>
        )}
        {showReject && (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Rejection reason (required)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleRejectWithdrawal}
              disabled={!!loading || !rejectReason.trim()}
              className={`${btnClass} bg-red-500/20 text-red-400 hover:bg-red-500/30`}
            >
              {loading === "reject_w" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
            </button>
          </div>
        )}
      </div>
    )
  }

  // type === "affiliate"
  return (
    <div className="flex items-center justify-center gap-1">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        onClick={handleToggle}
        disabled={!!loading}
        title={affiliateIsActive ? "Deactivate" : "Activate"}
        className={`${btnClass} ${affiliateIsActive ? "text-emerald-400 hover:bg-emerald-500/20" : "text-muted-foreground hover:bg-muted"}`}
      >
        {loading === "toggle" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : affiliateIsActive ? (
          <ToggleRight className="h-4 w-4" />
        ) : (
          <ToggleLeft className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
