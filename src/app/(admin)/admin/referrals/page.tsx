import { unstable_cache } from "next/cache";
import { Gift, Users, Percent, Award } from "lucide-react";
import Link from "next/link";
import { getServiceClient } from "@/lib/admin-auth";
import { StatCard } from "@/components/admin/stat-card";

interface TopReferrer {
  user_id: string;
  email: string;
  full_name: string;
  code: string;
  referral_count: number;
  converted_count: number;
}

interface RecentReferral {
  id: string;
  referral_code: string;
  status: string;
  reward_type: string | null;
  reward_amount: number | null;
  created_at: string;
  converted_at: string | null;
  rewarded_at: string | null;
  referrer_email: string;
  referred_email: string;
}

interface ReferralStats {
  total_codes: number;
  active_codes: number;
  total_referrals: number;
  converted_referrals: number;
  rewarded_referrals: number;
  total_rewards: number;
  conversion_rate: number;
  top_referrers: TopReferrer[];
  recent_referrals: RecentReferral[];
}

const getReferralStats = unstable_cache(
  async (): Promise<ReferralStats | null> => {
    const supabase = getServiceClient();
    const { data, error } = await supabase.rpc("admin_get_referral_stats");

    if (error) {
      console.error("[admin/referrals] RPC error:", error);
      return null;
    }

    return data as ReferralStats;
  },
  ["admin-referrals"],
  { revalidate: 60 }
);

const statusConfig: Record<string, { label: string; classes: string }> = {
  pending: {
    label: "Pending",
    classes: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  converted: {
    label: "Converted",
    classes: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  rewarded: {
    label: "Rewarded",
    classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? {
    label: status,
    classes: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config.classes}`}
    >
      {config.label}
    </span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminReferralsPage() {
  const data = await getReferralStats();

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">
          Failed to load referral data. Check server logs.
        </p>
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Codes",
      value: data.total_codes,
      icon: <Gift className="h-5 w-5" />,
    },
    {
      title: "Active Codes",
      value: data.active_codes,
      icon: <Gift className="h-5 w-5" />,
      subtitle: data.total_codes > 0
        ? `${Math.round((data.active_codes / data.total_codes) * 100)}% of total`
        : undefined,
    },
    {
      title: "Total Referrals",
      value: data.total_referrals,
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Converted",
      value: data.converted_referrals,
      icon: <Award className="h-5 w-5" />,
    },
    {
      title: "Conversion Rate",
      value: `${data.conversion_rate.toFixed(1)}%`,
      icon: <Percent className="h-5 w-5" />,
    },
    {
      title: "Total Rewards",
      value: formatCurrency(data.total_rewards),
      icon: <Award className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-emerald-500/15 p-2">
          <Gift className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Referrals</h1>
          <p className="text-sm text-muted-foreground">
            Referral program performance and tracking
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            subtitle={kpi.subtitle}
          />
        ))}
      </div>

      {/* Top Referrers */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Top Referrers
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Users with the most referrals
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Email</th>
                <th className="pb-3 pr-4 font-medium">Code</th>
                <th className="pb-3 pr-4 text-right font-medium">Referrals</th>
                <th className="pb-3 text-right font-medium">Converted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.top_referrers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No referrers yet
                  </td>
                </tr>
              ) : (
                data.top_referrers.map((referrer) => (
                  <tr key={referrer.user_id} className="text-foreground">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/users/${referrer.user_id}`}
                        className="text-blue-400 hover:underline"
                      >
                        {referrer.email}
                      </Link>
                      {referrer.full_name && (
                        <p className="text-xs text-muted-foreground">
                          {referrer.full_name}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {referrer.code}
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {referrer.referral_count}
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      {referrer.converted_count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Referrals */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Recent Referrals
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Latest referral activity
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Referrer</th>
                <th className="pb-3 pr-4 font-medium">Referred</th>
                <th className="pb-3 pr-4 font-medium">Code</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 text-right font-medium">Reward</th>
                <th className="pb-3 pr-4 font-medium">Created</th>
                <th className="pb-3 font-medium">Converted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.recent_referrals.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No referrals yet
                  </td>
                </tr>
              ) : (
                data.recent_referrals.map((referral) => (
                  <tr key={referral.id} className="text-foreground">
                    <td className="py-3 pr-4 text-xs">
                      {referral.referrer_email}
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {referral.referred_email}
                    </td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {referral.referral_code}
                      </code>
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={referral.status} />
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {referral.reward_amount != null
                        ? `${referral.reward_amount} ${referral.reward_type ?? "credits"}`
                        : "-"}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-xs text-muted-foreground">
                      {formatDate(referral.created_at)}
                    </td>
                    <td className="whitespace-nowrap py-3 text-xs text-muted-foreground">
                      {formatDate(referral.converted_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
