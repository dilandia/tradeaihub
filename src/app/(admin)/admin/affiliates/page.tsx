import {
  Users,
  ClipboardList,
  DollarSign,
  Wallet,
  CheckCircle2,
  XCircle,
  ChevronRight,
  BadgeCheck,
  BadgeX,
} from "lucide-react"
import Link from "next/link"
import { verifyAdmin } from "@/lib/admin-auth"
import { StatCard } from "@/components/admin/stat-card"
import {
  getAffiliateApplications,
  getAffiliatesList,
  getPendingWithdrawals,
  getAffiliateStats,
} from "@/app/actions/admin-affiliates"
import { AffiliateActionsClient } from "@/components/admin/affiliate-actions-client"

export default async function AdminAffiliatesPage() {
  await verifyAdmin()

  const [stats, applications, affiliates, withdrawals] = await Promise.all([
    getAffiliateStats(),
    getAffiliateApplications("pending"),
    getAffiliatesList(),
    getPendingWithdrawals(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Affiliate Program</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage applications, affiliates, commissions, and withdrawals
        </p>
      </div>

      {/* ── KPI Cards ── */}
      {!stats ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">Failed to load statistics. Please refresh the page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Applications"
            value={stats.total_applications}
            subtitle={`${stats.pending_applications} pending`}
            icon={<ClipboardList className="h-4 w-4" />}
          />
          <StatCard
            title="Active Affiliates"
            value={stats.active_affiliates}
            subtitle={`${stats.total_affiliates} total`}
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard
            title="Total Commissions"
            value={`$${Number(stats.total_commissions_earned).toFixed(2)}`}
            subtitle={`$${Number(stats.total_commissions_paid).toFixed(2)} paid`}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <StatCard
            title="Pending Withdrawals"
            value={`$${Number(stats.pending_withdrawals_amount).toFixed(2)}`}
            subtitle={`${stats.pending_withdrawals_count} requests`}
            icon={<Wallet className="h-4 w-4" />}
          />
        </div>
      )}

      {/* ── Pending Applications ── */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
          Pending Applications
          {applications.length > 0 && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
              {applications.length}
            </span>
          )}
        </h2>

        {applications.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No pending applications
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-border bg-card p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{app.full_name}</p>
                    <p className="text-sm text-muted-foreground">{app.email}</p>
                    {app.whatsapp && (
                      <p className="text-xs text-muted-foreground mt-0.5">WhatsApp: {app.whatsapp}</p>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground flex-shrink-0">
                    <p className="capitalize">{app.primary_social}</p>
                    {app.audience_size && <p className="text-xs">{app.audience_size}</p>}
                  </div>
                </div>

                {app.social_url && (
                  <a
                    href={app.social_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:underline"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {app.social_url}
                  </a>
                )}

                <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground italic leading-relaxed">
                  &ldquo;{app.pitch}&rdquo;
                </div>

                <AffiliateActionsClient applicationId={app.id} type="application" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Pending Withdrawals ── */}
      {withdrawals.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            Pending Withdrawals
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
              {withdrawals.length}
            </span>
          </h2>
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{w.affiliate_name}</p>
                    <p className="text-sm text-muted-foreground">{w.affiliate_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">${Number(w.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{w.currency.toUpperCase()}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-sm font-mono text-muted-foreground mb-3">
                  <p className="text-xs text-muted-foreground mb-1">{w.crypto_network}</p>
                  {w.crypto_wallet}
                </div>
                <AffiliateActionsClient withdrawalId={w.id} type="withdrawal" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Active Affiliates ── */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          All Affiliates
        </h2>

        {affiliates.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No affiliates yet
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Affiliate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Code</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Referrals</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Conversions</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Earned</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Paid</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {affiliates.map((aff) => (
                  <tr key={aff.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/affiliates/${aff.id}`} className="font-medium text-foreground hover:text-indigo-400 transition-colors">
                        {aff.full_name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{aff.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{aff.affiliate_code}</code>
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">
                      {(Number(aff.commission_rate) * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">{aff.total_referrals}</td>
                    <td className="px-4 py-3 text-right text-foreground">{aff.total_conversions}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">
                      ${Number(aff.total_earned).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      ${Number(aff.total_paid).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {aff.is_active ? (
                        <BadgeCheck className="h-4 w-4 text-emerald-400 mx-auto" />
                      ) : (
                        <BadgeX className="h-4 w-4 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AffiliateActionsClient
                        affiliateId={aff.id}
                        affiliateIsActive={aff.is_active}
                        type="affiliate"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
