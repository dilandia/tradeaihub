import { unstable_cache } from "next/cache";
import { Zap, Users, ShoppingCart } from "lucide-react";
import { getServiceClient } from "@/lib/admin-auth";
import { StatCard } from "@/components/admin/stat-card";
import { PlanBadge } from "@/components/admin/plan-badge";
import Link from "next/link";

interface TopUser {
  user_id: string;
  email: string;
  full_name: string;
  credits_remaining: number;
  credits_used_this_period: number;
  plan: string;
}

interface Adjustment {
  user_id: string;
  email: string;
  amount: number;
  reason: string;
  created_at: string;
}

interface Purchase {
  user_id: string;
  email: string;
  credits_amount: number;
  amount_paid_usd: number;
  created_at: string;
}

interface AiCreditsStats {
  total_credits_remaining: number;
  total_credits_used: number;
  users_with_credits: number;
  users_zero_credits: number;
  top_users: TopUser[];
  adjustments_30d: Adjustment[];
  purchases_30d: Purchase[];
}

const getAiCreditsStats = unstable_cache(
  async (): Promise<AiCreditsStats | null> => {
    const supabase = getServiceClient();
    const { data, error } = await supabase.rpc("admin_get_ai_credits_stats");

    if (error) {
      console.error("[admin/ai-credits] RPC error:", error);
      return null;
    }

    return data as AiCreditsStats;
  },
  ["admin-ai-credits"],
  { revalidate: 60 }
);

export default async function AdminAiCreditsPage() {
  const data = await getAiCreditsStats();

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Failed to load AI credits data. Check server logs.</p>
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Remaining",
      value: data.total_credits_remaining.toLocaleString("en-US"),
      icon: <Zap className="h-5 w-5" />,
    },
    {
      title: "Total Used",
      value: data.total_credits_used.toLocaleString("en-US"),
      icon: <Zap className="h-5 w-5" />,
    },
    {
      title: "Users With Credits",
      value: data.users_with_credits.toLocaleString("en-US"),
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Users Zero Credits",
      value: data.users_zero_credits.toLocaleString("en-US"),
      icon: <Users className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-amber-500/15 p-2">
          <Zap className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Credits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Credit distribution, usage, and purchase activity
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
          />
        ))}
      </div>

      {/* Top Users Table */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground">Top Users by Credits</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Plan</th>
                <th className="pb-3 pr-4 text-right">Remaining</th>
                <th className="pb-3 text-right">Used This Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.top_users.map((user) => (
                <tr key={user.user_id} className="text-foreground">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/users/${user.user_id}`}
                      className="text-indigo-400 hover:text-indigo-300 hover:underline"
                    >
                      {user.email}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <PlanBadge plan={user.plan} />
                  </td>
                  <td className="py-3 pr-4 text-right font-medium">
                    {user.credits_remaining.toLocaleString("en-US")}
                  </td>
                  <td className="py-3 text-right font-medium">
                    {user.credits_used_this_period.toLocaleString("en-US")}
                  </td>
                </tr>
              ))}
              {data.top_users.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No users with credits found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Adjustments Table */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Adjustments (30d)</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4 text-right">Amount</th>
                <th className="pb-3 pr-4">Reason</th>
                <th className="pb-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.adjustments_30d.map((adj, i) => (
                <tr key={`${adj.user_id}-${adj.created_at}-${i}`} className="text-foreground">
                  <td className="py-3 pr-4">{adj.email}</td>
                  <td className={`py-3 pr-4 text-right font-medium ${adj.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {adj.amount >= 0 ? "+" : ""}{adj.amount.toLocaleString("en-US")}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{adj.reason}</td>
                  <td className="py-3 text-right text-muted-foreground">
                    {new Date(adj.created_at).toLocaleDateString("en-US")}
                  </td>
                </tr>
              ))}
              {data.adjustments_30d.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No adjustments in the last 30 days
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Purchases Table */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Recent Purchases (30d)</h3>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4 text-right">Credits Bought</th>
                <th className="pb-3 pr-4 text-right">Amount Paid</th>
                <th className="pb-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.purchases_30d.map((purchase, i) => (
                <tr key={`${purchase.user_id}-${purchase.created_at}-${i}`} className="text-foreground">
                  <td className="py-3 pr-4">{purchase.email}</td>
                  <td className="py-3 pr-4 text-right font-medium">
                    {purchase.credits_amount.toLocaleString("en-US")}
                  </td>
                  <td className="py-3 pr-4 text-right font-medium text-emerald-400">
                    ${purchase.amount_paid_usd.toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-muted-foreground">
                    {new Date(purchase.created_at).toLocaleDateString("en-US")}
                  </td>
                </tr>
              ))}
              {data.purchases_30d.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No purchases in the last 30 days
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
