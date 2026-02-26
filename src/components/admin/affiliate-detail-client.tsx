"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Settings,
  Pencil,
  Check,
  X,
  Loader2,
  Plus,
  Minus,
  FileText,
} from "lucide-react"
import {
  updateAffiliateCode,
  updateCommissionRate,
  adjustAffiliateBalance,
} from "@/app/actions/admin-affiliates"
import type { AffiliateBalanceAdjustment } from "@/app/actions/admin-affiliates"

interface Props {
  affiliateId: string
  currentCode: string
  currentRate: number
  currentTotalEarned: number
  currentTotalPaid: number
  adjustments: AffiliateBalanceAdjustment[]
}

export function AffiliateDetailClient({
  affiliateId,
  currentCode,
  currentRate,
  currentTotalEarned,
  currentTotalPaid,
  adjustments,
}: Props) {
  const router = useRouter()

  // ── Code editing ──
  const [editingCode, setEditingCode] = useState(false)
  const [code, setCode] = useState(currentCode)
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState("")

  // ── Rate editing ──
  const [editingRate, setEditingRate] = useState(false)
  const [rate, setRate] = useState(String(currentRate * 100))
  const [rateLoading, setRateLoading] = useState(false)
  const [rateError, setRateError] = useState("")

  // ── Balance adjustment ──
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjField, setAdjField] = useState<"total_earned" | "total_paid">("total_earned")
  const [adjType, setAdjType] = useState<"credit" | "debit">("credit")
  const [adjAmount, setAdjAmount] = useState("")
  const [adjReason, setAdjReason] = useState("")
  const [adjLoading, setAdjLoading] = useState(false)
  const [adjError, setAdjError] = useState("")

  const inputClass =
    "rounded-lg border border-border bg-muted px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500"
  const btnSmall =
    "rounded-lg p-1.5 transition-colors hover:bg-muted disabled:opacity-50"

  // ── Save code ──
  async function handleSaveCode() {
    setCodeLoading(true)
    setCodeError("")
    const result = await updateAffiliateCode(affiliateId, code)
    setCodeLoading(false)
    if (result.success) {
      setEditingCode(false)
      router.refresh()
    } else {
      setCodeError(result.error ?? "Error")
    }
  }

  // ── Save rate ──
  async function handleSaveRate() {
    const numRate = parseFloat(rate) / 100
    if (isNaN(numRate) || numRate < 0 || numRate > 1) {
      setRateError("Rate must be between 0% and 100%")
      return
    }
    setRateLoading(true)
    setRateError("")
    const result = await updateCommissionRate(affiliateId, numRate)
    setRateLoading(false)
    if (result.success) {
      setEditingRate(false)
      router.refresh()
    } else {
      setRateError(result.error ?? "Error")
    }
  }

  // ── Adjust balance ──
  async function handleAdjust() {
    const numAmount = parseFloat(adjAmount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setAdjError("Enter a valid amount")
      return
    }
    setAdjLoading(true)
    setAdjError("")
    const result = await adjustAffiliateBalance(
      affiliateId,
      adjField,
      adjType,
      numAmount,
      adjReason
    )
    setAdjLoading(false)
    if (result.success) {
      setShowAdjust(false)
      setAdjAmount("")
      setAdjReason("")
      router.refresh()
    } else {
      setAdjError(result.error ?? "Error")
    }
  }

  // Preview calculation
  const currentFieldValue =
    adjField === "total_earned" ? currentTotalEarned : currentTotalPaid
  const previewAmount = parseFloat(adjAmount) || 0
  const previewDelta = adjType === "credit" ? previewAmount : -previewAmount
  const previewAfter = Math.max(0, currentFieldValue + previewDelta)

  return (
    <div className="space-y-6">
      {/* ── Settings Card ── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          Settings
        </h3>

        {/* Affiliate Code */}
        <div className="flex items-start justify-between py-2 border-b border-border/50">
          <span className="text-xs text-muted-foreground">Affiliate Code</span>
          {editingCode ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className={`${inputClass} w-40 text-xs font-mono`}
                maxLength={32}
                autoFocus
              />
              <button
                onClick={handleSaveCode}
                disabled={codeLoading}
                className={`${btnSmall} text-emerald-400`}
              >
                {codeLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={() => {
                  setEditingCode(false)
                  setCode(currentCode)
                  setCodeError("")
                }}
                className={`${btnSmall} text-muted-foreground`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                {currentCode}
              </code>
              <button
                onClick={() => setEditingCode(true)}
                className={`${btnSmall} text-muted-foreground hover:text-foreground`}
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
        {codeError && (
          <p className="text-xs text-red-400 mt-1">{codeError}</p>
        )}

        {/* Commission Rate */}
        <div className="flex items-start justify-between py-2 border-b border-border/50">
          <span className="text-xs text-muted-foreground">Commission Rate</span>
          {editingRate ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className={`${inputClass} w-20 text-xs text-right`}
                  min={0}
                  max={100}
                  step={1}
                  autoFocus
                />
                <span className="text-xs text-muted-foreground ml-1">%</span>
              </div>
              <button
                onClick={handleSaveRate}
                disabled={rateLoading}
                className={`${btnSmall} text-emerald-400`}
              >
                {rateLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={() => {
                  setEditingRate(false)
                  setRate(String(currentRate * 100))
                  setRateError("")
                }}
                className={`${btnSmall} text-muted-foreground`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">
                {(currentRate * 100).toFixed(0)}%
              </span>
              <button
                onClick={() => setEditingRate(true)}
                className={`${btnSmall} text-muted-foreground hover:text-foreground`}
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
        {rateError && (
          <p className="text-xs text-red-400 mt-1">{rateError}</p>
        )}

        {/* Balance Rows */}
        <div className="flex items-start justify-between py-2 border-b border-border/50">
          <span className="text-xs text-muted-foreground">Total Earned</span>
          <span className="text-sm text-emerald-400 font-medium">
            ${currentTotalEarned.toFixed(2)}
          </span>
        </div>
        <div className="flex items-start justify-between py-2 border-b border-border/50">
          <span className="text-xs text-muted-foreground">Total Paid</span>
          <span className="text-sm text-foreground">
            ${currentTotalPaid.toFixed(2)}
          </span>
        </div>

        {/* Adjust Balance Button */}
        <div className="mt-4">
          <button
            onClick={() => setShowAdjust((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-500/30 transition-colors"
          >
            {showAdjust ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            {showAdjust ? "Cancel" : "Adjust Balance"}
          </button>
        </div>

        {/* Adjust Balance Form */}
        {showAdjust && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            {/* Field selector */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Field
              </label>
              <div className="flex gap-2">
                {(["total_earned", "total_paid"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setAdjField(f)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      adjField === f
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f === "total_earned" ? "Total Earned" : "Total Paid"}
                  </button>
                ))}
              </div>
            </div>

            {/* Type toggle */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAdjType("credit")}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    adjType === "credit"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Plus className="h-3 w-3" /> Credit
                </button>
                <button
                  onClick={() => setAdjType("debit")}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    adjType === "debit"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Minus className="h-3 w-3" /> Debit
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                value={adjAmount}
                onChange={(e) => setAdjAmount(e.target.value)}
                className={`${inputClass} w-full`}
                placeholder="0.00"
                min={0.01}
                max={999999.99}
                step={0.01}
              />
            </div>

            {/* Reason */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Reason (min 5 chars)
              </label>
              <textarea
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                className={`${inputClass} w-full h-16 resize-none`}
                placeholder="Reason for this adjustment..."
              />
            </div>

            {/* Preview */}
            {previewAmount > 0 && (
              <div className="rounded-lg bg-muted p-3 text-xs">
                <span className="text-muted-foreground">
                  {adjField === "total_earned" ? "total_earned" : "total_paid"}
                </span>{" "}
                <span className="text-foreground font-mono">
                  ${currentFieldValue.toFixed(2)}
                </span>{" "}
                <span className="text-muted-foreground">→</span>{" "}
                <span
                  className={`font-mono font-medium ${
                    previewAfter > currentFieldValue
                      ? "text-emerald-400"
                      : previewAfter < currentFieldValue
                        ? "text-red-400"
                        : "text-foreground"
                  }`}
                >
                  ${previewAfter.toFixed(2)}
                </span>
              </div>
            )}

            {adjError && (
              <p className="text-xs text-red-400">{adjError}</p>
            )}

            <button
              onClick={handleAdjust}
              disabled={adjLoading || !adjAmount || !adjReason.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-600 transition-colors disabled:opacity-50"
            >
              {adjLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Apply Adjustment
            </button>
          </div>
        )}
      </div>

      {/* ── Audit Log ── */}
      {adjustments.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Balance Adjustments Log
          </h3>
          <div className="space-y-0 max-h-48 overflow-y-auto">
            {adjustments.map((adj) => (
              <div
                key={adj.id}
                className="flex items-start justify-between py-2 border-b border-border/50 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${
                        adj.type === "credit"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {adj.type === "credit" ? "+" : "−"}${Number(adj.amount).toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      on {adj.field === "total_earned" ? "earned" : "paid"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {adj.reason}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-xs text-muted-foreground font-mono">
                    ${Number(adj.balance_before).toFixed(2)} → ${Number(adj.balance_after).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(adj.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
