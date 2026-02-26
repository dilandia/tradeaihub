import { notFound } from "next/navigation"
import {
  ArrowLeft,
  BadgeCheck,
  BadgeX,
  Users,
  DollarSign,
  TrendingUp,
  Wallet,
  Calendar,
  Globe,
  MessageCircle,
  Mail,
} from "lucide-react"
import Link from "next/link"
import { verifyAdmin } from "@/lib/admin-auth"
import { getAffiliateDetail } from "@/app/actions/admin-affiliates"
import { AffiliateDetailClient } from "@/components/admin/affiliate-detail-client"

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function Card({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground text-right max-w-[60%] break-all">
        {value ?? "—"}
      </span>
    </div>
  )
}

export default async function AffiliateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await verifyAdmin()
  const { id } = await params

  const data = await getAffiliateDetail(id)
  if (!data) notFound()

  const { affiliate: aff, application: app, commissions, withdrawals } = data

  const balance = Number(aff.total_earned) - Number(aff.total_paid)

  return (
    <div className="space-y-6">
      {/* ── Back + Header ── */}
      <div>
        <Link
          href="/admin/affiliates"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Affiliates
        </Link>

        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-lg font-bold text-indigo-400 flex-shrink-0">
            {aff.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{aff.full_name}</h1>
              {aff.is_active ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  <BadgeCheck className="h-3 w-3" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                  <BadgeX className="h-3 w-3" /> Inactive
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> {aff.email}
              </span>
              {aff.whatsapp && (
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> {aff.whatsapp}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Referrals",
            value: aff.total_referrals,
            icon: <Users className="h-4 w-4" />,
            color: "text-foreground",
          },
          {
            label: "Conversions",
            value: aff.total_conversions,
            icon: <TrendingUp className="h-4 w-4" />,
            color: "text-foreground",
          },
          {
            label: "Total Earned",
            value: `$${Number(aff.total_earned).toFixed(2)}`,
            icon: <DollarSign className="h-4 w-4" />,
            color: "text-emerald-400",
          },
          {
            label: "Balance Owed",
            value: `$${balance.toFixed(2)}`,
            icon: <Wallet className="h-4 w-4" />,
            color: balance > 0 ? "text-amber-400" : "text-foreground",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {kpi.icon}
              <span className="text-xs">{kpi.label}</span>
            </div>
            <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ── Two Column Grid ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Settings (Client Component) */}
          <AffiliateDetailClient
            affiliateId={aff.id}
            currentCode={aff.affiliate_code}
            currentRate={Number(aff.commission_rate)}
            currentTotalEarned={Number(aff.total_earned)}
            currentTotalPaid={Number(aff.total_paid)}
            adjustments={data.adjustments}
          />

          {/* Payout Details */}
          <Card title="Payout Details" icon={<Wallet className="h-4 w-4 text-muted-foreground" />}>
            <Row label="Crypto Wallet" value={
              aff.crypto_wallet ? (
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono break-all">
                  {aff.crypto_wallet}
                </code>
              ) : "Not set"
            } />
            <Row label="Network" value={aff.crypto_network ?? "Not set"} />
            <Row
              label="Commission Type"
              value={`${(Number(aff.commission_rate) * 100).toFixed(0)}% per conversion`}
            />
            <Row label="Member Since" value={formatDate(aff.created_at)} />
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Application Details */}
          {app && (
            <Card title="Application" icon={<Globe className="h-4 w-4 text-muted-foreground" />}>
              <Row label="Status" value={
                <span className={`capitalize ${
                  app.status === "approved" ? "text-emerald-400" :
                  app.status === "rejected" ? "text-red-400" :
                  "text-amber-400"
                }`}>
                  {app.status}
                </span>
              } />
              <Row label="Primary Social" value={app.primary_social} />
              <Row label="Social URL" value={
                app.social_url ? (
                  <a
                    href={app.social_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline text-xs"
                  >
                    {app.social_url}
                  </a>
                ) : null
              } />
              <Row label="Audience Size" value={app.audience_size} />
              <Row label="Trading Experience" value={app.trading_experience} />
              <Row label="Applied" value={formatDate(app.created_at)} />
              <Row label="Reviewed" value={formatDate(app.reviewed_at)} />
              {app.pitch && (
                <div className="mt-3 rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground italic leading-relaxed">
                  &ldquo;{app.pitch}&rdquo;
                </div>
              )}
              {app.review_notes && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium">Review notes:</span> {app.review_notes}
                </div>
              )}
            </Card>
          )}

          {/* Commissions History */}
          <Card title="Commissions History" icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}>
            {commissions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No commissions yet
              </p>
            ) : (
              <div className="space-y-0 max-h-64 overflow-y-auto">
                {commissions.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div>
                      <p className="text-xs text-foreground capitalize">{c.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(c.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-400">
                        +${Number(c.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{c.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Withdrawals History */}
          <Card title="Withdrawals History" icon={<Calendar className="h-4 w-4 text-muted-foreground" />}>
            {withdrawals.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No withdrawals yet
              </p>
            ) : (
              <div className="space-y-0 max-h-64 overflow-y-auto">
                {withdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div>
                      <p className="text-xs text-foreground">
                        {w.crypto_network}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(w.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        ${Number(w.amount).toFixed(2)}
                      </p>
                      <p className={`text-xs capitalize ${
                        w.status === "completed" ? "text-emerald-400" :
                        w.status === "rejected" ? "text-red-400" :
                        "text-amber-400"
                      }`}>
                        {w.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
