"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Copy,
  Check,
  Users,
  DollarSign,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
} from "lucide-react"
import type { AffiliateDashboardData } from "@/app/actions/affiliates"
import { updatePayoutInfo, requestWithdrawal } from "@/app/actions/affiliates"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  isAffiliate: boolean
  dashboard: AffiliateDashboardData | null
}

// ─── Not an affiliate CTA ─────────────────────────────────────────────────────

function NotAffiliateCta() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20 mb-6">
        <DollarSign className="h-8 w-8 text-indigo-400" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-3">Affiliate Partner Program</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Earn recurring commissions by promoting TakeZ Plan to your audience.
        Apply to become an affiliate partner and get paid every month.
      </p>
      <a
        href="/affiliates"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-all"
      >
        <ExternalLink className="h-4 w-4" />
        Learn More & Apply
      </a>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ title, value, subtitle, icon: Icon, highlight }: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card"}`}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`rounded-lg p-2 ${highlight ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={`mt-2 text-3xl font-bold ${highlight ? "text-emerald-400" : "text-foreground"}`}>{value}</p>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    registered: { label: "Registered", className: "bg-blue-500/20 text-blue-400" },
    converted: { label: "Converted", className: "bg-emerald-500/20 text-emerald-400" },
    churned: { label: "Churned", className: "bg-red-500/20 text-red-400" },
    pending: { label: "Pending", className: "bg-amber-500/20 text-amber-400" },
    approved: { label: "Approved", className: "bg-emerald-500/20 text-emerald-400" },
    paid: { label: "Paid", className: "bg-indigo-500/20 text-indigo-400" },
    refunded: { label: "Refunded", className: "bg-red-500/20 text-red-400" },
    cancelled: { label: "Cancelled", className: "bg-gray-500/20 text-gray-400" },
    completed: { label: "Completed", className: "bg-emerald-500/20 text-emerald-400" },
    rejected: { label: "Rejected", className: "bg-red-500/20 text-red-400" },
    processing: { label: "Processing", className: "bg-blue-500/20 text-blue-400" },
  }
  const config = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

// ─── Payout Settings ─────────────────────────────────────────────────────────

function PayoutSettings({ wallet, network }: { wallet: string | null; network: string | null }) {
  const router = useRouter()
  const [form, setForm] = useState({ wallet: wallet ?? "", network: network ?? "" })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const networks = ["USDT-TRC20", "USDC-ERC20", "BTC", "ETH"]

  async function handleSave() {
    setLoading(true)
    setError("")
    const result = await updatePayoutInfo(form.wallet, form.network)
    setLoading(false)
    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    } else {
      setError(result.error ?? "Error saving")
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            Crypto Wallet Address
          </label>
          <input
            type="text"
            value={form.wallet}
            onChange={(e) => setForm((f) => ({ ...f, wallet: e.target.value }))}
            placeholder="Your wallet address"
            className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            Network
          </label>
          <select
            value={form.network}
            onChange={(e) => setForm((f) => ({ ...f, network: e.target.value }))}
            className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500"
          >
            <option value="">Select network</option>
            {networks.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        onClick={handleSave}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
        {saved ? "Saved!" : "Save Payout Info"}
      </button>
    </div>
  )
}

// ─── Withdrawal Request ───────────────────────────────────────────────────────

function WithdrawalRequest({ availableBalance }: { availableBalance: number }) {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleRequest() {
    const val = parseFloat(amount)
    if (isNaN(val) || val < 50) {
      setError("Minimum withdrawal is $50")
      return
    }
    setLoading(true)
    setError("")
    const result = await requestWithdrawal(val)
    setLoading(false)
    if (result.success) {
      setSuccess(true)
      setAmount("")
      router.refresh()
    } else {
      setError(result.error ?? "Error")
    }
  }

  if (availableBalance < 50) {
    return (
      <p className="text-sm text-muted-foreground">
        You need at least <span className="font-semibold text-foreground">$50.00</span> available balance to request a withdrawal.
        Current balance: <span className="font-semibold text-foreground">${availableBalance.toFixed(2)}</span>
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Withdrawal request submitted! We&apos;ll process it within 7 days.
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <input
            type="number"
            min={50}
            max={availableBalance}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="50.00"
            className="w-36 rounded-lg border border-border bg-muted/30 pl-7 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={handleRequest}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
          Request Withdrawal
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Available: <span className="font-semibold text-foreground">${availableBalance.toFixed(2)}</span>
      </p>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function AffiliateDashboardContent({ isAffiliate, dashboard }: Props) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "referrals" | "commissions" | "withdrawals" | "settings">("overview")

  if (!isAffiliate || !dashboard) {
    return <NotAffiliateCta />
  }

  const { affiliate, stats, recentReferrals, recentCommissions, withdrawals } = dashboard
  const affiliateLink = `https://tradeaihub.com/?aff=${affiliate.affiliateCode}`

  function copyLink() {
    navigator.clipboard.writeText(affiliateLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "referrals" as const, label: "Referrals" },
    { id: "commissions" as const, label: "Commissions" },
    { id: "withdrawals" as const, label: "Withdrawals" },
    { id: "settings" as const, label: "Settings" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Affiliate Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Commission rate: <span className="font-semibold text-foreground">{(affiliate.commissionRate * 100).toFixed(0)}%</span> recurring
          {!affiliate.isActive && (
            <span className="ml-2 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">Inactive</span>
          )}
        </p>
      </div>

      {/* Affiliate link */}
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">Your Affiliate Link</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
            {affiliateLink}
          </code>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-indigo-500 transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-indigo-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard
            title="Total Referrals"
            value={String(stats.totalReferrals)}
            subtitle={`${stats.totalConversions} converted`}
            icon={Users}
          />
          <StatCard
            title="Total Earned"
            value={`$${stats.totalEarned.toFixed(2)}`}
            subtitle={`$${stats.totalPaid.toFixed(2)} paid out`}
            icon={TrendingUp}
          />
          <StatCard
            title="Available Balance"
            value={`$${stats.availableBalance.toFixed(2)}`}
            subtitle={`$${stats.pendingCommissions.toFixed(2)} pending`}
            icon={DollarSign}
            highlight={stats.availableBalance >= 50}
          />
        </div>
      )}

      {/* Tab: Referrals */}
      {activeTab === "referrals" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {recentReferrals.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No referrals yet. Share your affiliate link to get started!
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Converted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentReferrals.map((r, i) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 text-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.convertedAt ? new Date(r.convertedAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Commissions */}
      {activeTab === "commissions" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {recentCommissions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No commissions yet. Commissions are generated when your referrals subscribe.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Payment</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Commission</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentCommissions.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      ${c.paymentAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                      ${c.commissionAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Withdrawals */}
      {activeTab === "withdrawals" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4">Request Withdrawal</h3>
            <WithdrawalRequest availableBalance={stats.availableBalance} />
          </div>

          {withdrawals.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-medium text-foreground text-sm">Withdrawal History</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Network</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">TX Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-foreground">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">
                        ${w.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{w.cryptoNetwork}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={w.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs font-mono truncate max-w-[120px]">
                        {w.txHash ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === "settings" && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-1">Payout Settings</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Set your crypto wallet to receive payouts. Minimum payout is $50.
          </p>
          <PayoutSettings wallet={affiliate.cryptoWallet} network={affiliate.cryptoNetwork} />
        </div>
      )}
    </div>
  )
}
