import { unstable_cache } from "next/cache";
import { Users, UserPlus, Activity, BarChart3, MessageSquare, Zap } from "lucide-react";
import { getServiceClient, verifyAdmin } from "@/lib/admin-auth";
import { StatCard } from "@/components/admin/stat-card";
import { OverviewCharts } from "@/components/admin/overview-charts";

interface RecentSignup {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  plan: string;
}

interface OverviewData {
  total_users: number;
  new_users_7d: number;
  active_users_7d: number;
  total_trades: number;
  pending_feedback: number;
  plans: { free: number; pro: number; elite: number };
  total_ai_credits: number;
  signups_30d: Array<{ day: string; count: number }>;
  recent_signups: RecentSignup[];
}

const getOverviewData = unstable_cache(
  async (): Promise<OverviewData | null> => {
    const supabase = getServiceClient();
    const { data, error } = await supabase.rpc("admin_get_dashboard_overview");

    if (error) {
      console.error("[admin/overview] RPC error:", error);
      return null;
    }

    return data as OverviewData;
  },
  ["admin-overview"],
  { revalidate: 60 }
);

export default async function AdminOverviewPage() {
  await verifyAdmin();
  const data = await getOverviewData();

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Failed to load overview data. Check server logs.</p>
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Users",
      value: data.total_users,
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "New Users (7d)",
      value: data.new_users_7d,
      icon: <UserPlus className="h-5 w-5" />,
    },
    {
      title: "Active Users (7d)",
      value: data.active_users_7d,
      icon: <Activity className="h-5 w-5" />,
      subtitle: data.total_users > 0
        ? `${Math.round((data.active_users_7d / data.total_users) * 100)}% of total`
        : undefined,
    },
    {
      title: "Total Trades",
      value: data.total_trades.toLocaleString(),
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Pending Feedback",
      value: data.pending_feedback,
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: "AI Credits in Circulation",
      value: data.total_ai_credits,
      icon: <Zap className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform metrics at a glance
        </p>
      </div>

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

      <OverviewCharts
        signups30d={data.signups_30d ?? []}
        plans={data.plans ?? { free: 0, pro: 0, elite: 0 }}
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Signups</h3>
        {data.recent_signups && data.recent_signups.length > 0 ? (
          <div className="mt-4 divide-y divide-border">
            {data.recent_signups.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {user.full_name || "No name"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                    user.plan === "elite"
                      ? "border-amber-500/30 bg-amber-500/15 text-amber-400"
                      : user.plan === "pro"
                        ? "border-indigo-500/30 bg-indigo-500/15 text-indigo-400"
                        : "border-zinc-500/30 bg-zinc-500/15 text-zinc-400"
                  }`}>
                    {user.plan}
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("en-US", {
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
        ) : (
          <div className="mt-4 flex h-32 items-center justify-center">
            <p className="text-sm text-muted-foreground">No recent signups</p>
          </div>
        )}
      </div>
    </div>
  );
}
