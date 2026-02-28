import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Clock,
  Zap,
  BarChart3,
  MessageSquare,
  Gift,
  CreditCard,
  Shield,
} from "lucide-react";
import { getServiceClient, verifyAdmin } from "@/lib/admin-auth";
import { PlanBadge } from "@/components/admin/plan-badge";
import { CreditManageButton } from "@/components/admin/credit-manage-button";
import { UserEmailActions } from "@/components/admin/user-email-actions";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(num: number | null | undefined): string {
  if (num == null) return "0";
  return num.toLocaleString("en-US");
}

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  await verifyAdmin();
  const { userId } = await params;

  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("admin_get_user_detail", {
    p_user_id: userId,
  });

  if (error || !data?.profile) {
    console.error("Failed to fetch user detail:", error);
    notFound();
  }

  const profile = data.profile;
  const subscription = data.subscription;
  const credits = data.ai_credits ?? { total_remaining: 0, total_used: 0 };
  const stats = data.trade_stats ?? { total: 0, wins: 0, losses: 0, net_profit: 0 };
  const feedbackList = data.feedback ?? [];
  const referral = data.referral;
  const creditHistory = data.credit_adjustments ?? [];
  const plan = subscription?.plan ?? "free";
  const winRate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      {/* Profile Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/15 text-xl font-bold text-indigo-400">
              {(profile.full_name ?? profile.email ?? "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {profile.full_name || "No Name"}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {profile.email}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  {profile.role ?? "user"}
                </span>
              </div>
              <div className="mt-2">
                <UserEmailActions
                  userId={userId}
                  currentEmail={profile.email}
                  emailConfirmed={!!profile.email_confirmed_at}
                />
              </div>
            </div>
          </div>
          <PlanBadge plan={plan} className="self-start" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Signup Date</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {formatDate(profile.created_at)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Sign-in</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {formatDateTime(profile.last_sign_in_at)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email Confirmed</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {profile.email_confirmed_at ? "Yes" : "No"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Subscription</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              <span
                className={`inline-flex items-center gap-1.5 ${
                  subscription?.status === "active"
                    ? "text-emerald-400"
                    : "text-slate-400"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    subscription?.status === "active"
                      ? "bg-emerald-400"
                      : "bg-slate-500"
                  }`}
                />
                {subscription?.status ?? "free"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Plan & Billing */}
          <Card
            icon={<CreditCard className="h-4 w-4 text-indigo-400" />}
            title="Plan & Billing"
          >
            <dl className="space-y-3">
              <Row label="Plan" value={<PlanBadge plan={plan} />} />
              <Row
                label="Billing Interval"
                value={subscription?.billing_interval ?? "--"}
              />
              <Row
                label="Period End"
                value={formatDate(subscription?.current_period_end)}
              />
              <Row
                label="Stripe Customer"
                value={
                  subscription?.stripe_customer_id ? (
                    <a
                      href={`https://dashboard.stripe.com/customers/${subscription.stripe_customer_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:underline"
                    >
                      {subscription.stripe_customer_id.slice(0, 18)}...
                    </a>
                  ) : (
                    "--"
                  )
                }
              />
            </dl>
          </Card>

          {/* AI Credits */}
          <Card
            icon={<Zap className="h-4 w-4 text-amber-400" />}
            title="AI Credits"
            action={
              <CreditManageButton
                userId={userId}
                currentBalance={credits.total_remaining}
              />
            }
          >
            <dl className="space-y-3">
              <Row
                label="Balance"
                value={
                  <span className="text-lg font-bold text-foreground">
                    {formatNumber(credits.total_remaining)}
                  </span>
                }
              />
              <Row label="Used" value={formatNumber(credits.total_used)} />
            </dl>
          </Card>

          {/* Trade Stats */}
          <Card
            icon={<BarChart3 className="h-4 w-4 text-emerald-400" />}
            title="Trade Statistics"
          >
            <dl className="space-y-3">
              <Row label="Total Trades" value={formatNumber(stats.total)} />
              <Row label="Wins" value={formatNumber(stats.wins)} />
              <Row label="Losses" value={formatNumber(stats.losses)} />
              <Row
                label="Win Rate"
                value={stats.total > 0 ? `${winRate.toFixed(1)}%` : "--"}
              />
              <Row
                label="Net Profit"
                value={
                  stats.net_profit != null
                    ? `$${Number(stats.net_profit).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                    : "--"
                }
              />
              <Row label="First Trade" value={formatDate(stats.first_trade)} />
              <Row label="Last Trade" value={formatDate(stats.last_trade)} />
            </dl>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Feedback */}
          <Card
            icon={<MessageSquare className="h-4 w-4 text-blue-400" />}
            title={`Feedback (${feedbackList.length})`}
          >
            {feedbackList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No feedback submitted.
              </p>
            ) : (
              <div className="space-y-3">
                {feedbackList.map(
                  (
                    fb: {
                      id: string;
                      type: string;
                      message: string;
                      rating: number | null;
                      created_at: string;
                      resolved_at: string | null;
                    },
                    idx: number
                  ) => (
                    <div
                      key={fb.id ?? idx}
                      className="rounded-lg border border-border bg-muted/30 px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {fb.type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(fb.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-foreground">
                        {fb.message}
                      </p>
                      {fb.rating != null && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Rating: {fb.rating}/10
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </Card>

          {/* Referral */}
          <Card
            icon={<Gift className="h-4 w-4 text-purple-400" />}
            title="Referral Program"
          >
            {!referral ? (
              <p className="text-sm text-muted-foreground">
                No referral data.
              </p>
            ) : (
              <dl className="space-y-3">
                <Row label="Referral Code" value={referral.code ?? "--"} />
                <Row
                  label="Total Referrals"
                  value={formatNumber(referral.referral_count)}
                />
                <Row
                  label="Converted"
                  value={formatNumber(referral.converted_count)}
                />
              </dl>
            )}
          </Card>

          {/* Credit Adjustment History */}
          <Card
            icon={<Clock className="h-4 w-4 text-orange-400" />}
            title={`Credit Adjustments (${creditHistory.length})`}
          >
            {creditHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No adjustments recorded.
              </p>
            ) : (
              <div className="space-y-2">
                {creditHistory.map(
                  (
                    adj: {
                      amount: number;
                      balance_before: number;
                      balance_after: number;
                      reason: string;
                      created_at: string;
                    },
                    idx: number
                  ) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">{adj.reason}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {adj.balance_before} → {adj.balance_after} | {formatDate(adj.created_at)}
                        </p>
                      </div>
                      <span
                        className={`ml-3 shrink-0 text-sm font-semibold ${
                          adj.amount > 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {adj.amount > 0 ? "+" : ""}
                        {adj.amount}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ----- Shared sub-components ----- */

function Card({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
