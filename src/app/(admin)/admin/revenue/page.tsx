import { unstable_cache } from "next/cache";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Users,
  UserMinus,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import { getServiceClient, verifyAdmin } from "@/lib/admin-auth";
import { StatCard } from "@/components/admin/stat-card";
import Stripe from "stripe";

/* ---------- Types ---------- */

interface PlanBreakdown {
  plan: string;
  billing_interval: string;
  count: number;
  revenue: number;
}

interface StripeCharge {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  customer_email: string | null;
  created: number;
}

interface RevenueData {
  /* Stripe real data */
  stripe_mrr: number;
  stripe_total_revenue: number;
  stripe_active_subs: number;
  stripe_charges_30d: StripeCharge[];
  stripe_revenue_30d: number;
  stripe_canceled_30d: number;
  stripe_new_subs_30d: number;
  /* Supabase data */
  plan_breakdown: PlanBreakdown[];
  total_credit_revenue: number;
}

/* ---------- TakeZ Plan Product IDs (filter out other projects) ---------- */

const TAKEZ_PRODUCT_IDS = new Set([
  "prod_U0ObDdFz3zCnBx", // TakeZ Plan Elite
  "prod_U0Obihpx5sAOqT", // TakeZ Plan Pro
  "prod_U0ObOtPENeQCW5", // TakeZ Plan - Créditos IA
]);

/* TakeZ Plan Price IDs (pre-mapped to avoid deep expand) */
const TAKEZ_PRICE_IDS = new Set([
  "price_1T2No4La3H9uhiz9AeXgNnOH", // Elite yearly
  "price_1T2No4La3H9uhiz9NBFTHWwl", // Elite monthly
  "price_1T2No3La3H9uhiz9wPt2rstL", // Pro yearly
  "price_1T2No2La3H9uhiz9MvKjqtRP", // Pro monthly
  "price_1T2No6La3H9uhiz9YPiWc72R", // Credits $9.99
  "price_1T2No5La3H9uhiz9SMWQ27HJ", // Credits $5.99
  "price_1T2No5La3H9uhiz9d9eJwTGB", // Credits $2.99
]);

/* ---------- Helpers ---------- */

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ---------- Data fetching ---------- */

const getRevenueData = unstable_cache(
  async (): Promise<RevenueData | null> => {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-01-27.acacia" as Stripe.LatestApiVersion,
      });

      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

      /* Helper: check if subscription belongs to TakeZ Plan via price IDs */
      function isTakezSub(sub: Stripe.Subscription): boolean {
        return sub.items.data.some((item) =>
          TAKEZ_PRICE_IDS.has(item.price.id)
        );
      }

      /* Parallel: Stripe API + Supabase RPC (no deep expand needed) */
      const [
        allActiveSubs,
        allCanceledSubs,
        charges,
        supabaseData,
      ] = await Promise.all([
        /* Active subscriptions */
        stripe.subscriptions.list({
          status: "active",
          limit: 100,
          expand: ["data.customer"],
        }),
        /* Canceled in last 30d */
        stripe.subscriptions.list({
          status: "canceled",
          limit: 100,
          created: { gte: thirtyDaysAgo },
        }),
        /* Charges in last 30d */
        stripe.charges.list({
          limit: 100,
          created: { gte: thirtyDaysAgo },
          expand: ["data.invoice", "data.customer"],
        }),
        /* Supabase plan breakdown */
        (async () => {
          const supabase = getServiceClient();
          const { data } = await supabase.rpc("admin_get_revenue_stats");
          return data;
        })(),
      ]);

      /* Filter subscriptions to TakeZ Plan products only */
      const activeSubs = allActiveSubs.data.filter(isTakezSub);
      const canceledSubs = allCanceledSubs.data.filter(isTakezSub);

      /* Calculate real MRR from active TakeZ Plan subscriptions */
      let stripeMrr = 0;
      for (const sub of activeSubs) {
        for (const item of sub.items.data) {
          if (!TAKEZ_PRICE_IDS.has(item.price.id)) continue;
          const price = item.price;
          if (!price?.unit_amount) continue;
          const amount = price.unit_amount / 100;
          if (price.recurring?.interval === "year") {
            stripeMrr += amount / 12;
          } else if (price.recurring?.interval === "month") {
            stripeMrr += amount;
          }
        }
      }

      /* New subs in last 30d */
      const newSubs30d = activeSubs.filter(
        (s) => s.created >= thirtyDaysAgo
      ).length;

      /* Filter charges: only those linked to TakeZ Plan subscriptions */
      const takezSubIds = new Set(activeSubs.map((s) => s.id));
      /* Also include canceled TakeZ subs (they may have charges) */
      for (const cs of canceledSubs) takezSubIds.add(cs.id);

      const stripeCharges: StripeCharge[] = [];
      let stripeRevenue30d = 0;

      for (const charge of charges.data) {
        if (charge.status !== "succeeded") continue;

        /* Check if charge is linked to a TakeZ Plan subscription via invoice */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chargeAny = charge as any;
        if (chargeAny.invoice && typeof chargeAny.invoice === "object") {
          const subRef = chargeAny.invoice.subscription;
          if (subRef) {
            const subId = typeof subRef === "string" ? subRef : subRef.id;
            if (!takezSubIds.has(subId)) continue;
          }
        }

        const amount = charge.amount / 100;
        stripeCharges.push({
          id: charge.id,
          amount,
          currency: charge.currency,
          status: charge.status,
          description: charge.description,
          customer_email:
            (typeof charge.customer === "object" && charge.customer !== null
              ? (charge.customer as { email?: string | null }).email
              : null) ??
            charge.receipt_email ??
            null,
          created: charge.created,
        });
        stripeRevenue30d += amount;
      }

      /* Stripe balance (shared across all products — show as-is) */
      let stripeTotalRevenue = stripeRevenue30d;
      try {
        const balance = await stripe.balance.retrieve();
        const available = balance.available.reduce(
          (sum, b) => sum + b.amount,
          0
        );
        const pending = balance.pending.reduce(
          (sum, b) => sum + b.amount,
          0
        );
        stripeTotalRevenue = (available + pending) / 100;
      } catch {
        /* fallback to 30d */
      }

      return {
        stripe_mrr: stripeMrr,
        stripe_total_revenue: stripeTotalRevenue,
        stripe_active_subs: activeSubs.length,
        stripe_charges_30d: stripeCharges,
        stripe_revenue_30d: stripeRevenue30d,
        stripe_canceled_30d: canceledSubs.length,
        stripe_new_subs_30d: newSubs30d,
        plan_breakdown: supabaseData?.plan_breakdown ?? [],
        total_credit_revenue: supabaseData?.total_credit_revenue ?? 0,
      };
    } catch (err) {
      console.error("[admin/revenue] Error fetching data:", err);
      return null;
    }
  },
  ["admin-revenue-stripe"],
  { revalidate: 120 }
);

/* ---------- Page ---------- */

export default async function AdminRevenuePage() {
  await verifyAdmin();
  const data = await getRevenueData();

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">
          Failed to load revenue data. Check server logs.
        </p>
      </div>
    );
  }

  const kpis = [
    {
      title: "MRR (Stripe)",
      value: formatCurrency(data.stripe_mrr),
      icon: <DollarSign className="h-5 w-5" />,
      subtitle: "From active subscriptions",
    },
    {
      title: "Revenue (30d)",
      value: formatCurrency(data.stripe_revenue_30d),
      icon: <TrendingUp className="h-5 w-5" />,
      subtitle: `${data.stripe_charges_30d.length} charges`,
    },
    {
      title: "Active Subscribers",
      value: data.stripe_active_subs,
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "New Subs (30d)",
      value: data.stripe_new_subs_30d,
      icon: <ArrowUpRight className="h-5 w-5" />,
    },
    {
      title: "Churned (30d)",
      value: data.stripe_canceled_30d,
      icon: <UserMinus className="h-5 w-5" />,
    },
    {
      title: "Credit Revenue",
      value: formatCurrency(data.total_credit_revenue),
      icon: <CreditCard className="h-5 w-5" />,
      subtitle: "AI credit purchases",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-emerald-500/15 p-2">
          <DollarSign className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Revenue
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time data from Stripe + Supabase
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

      {/* Plan Breakdown (Supabase) */}
      {data.plan_breakdown && data.plan_breakdown.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Plan Breakdown
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Plan</th>
                  <th className="pb-3 pr-4 font-medium">Billing</th>
                  <th className="pb-3 pr-4 text-right font-medium">
                    Subscribers
                  </th>
                  <th className="pb-3 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.plan_breakdown.map((row, i) => (
                  <tr
                    key={`${row.plan}-${row.billing_interval}`}
                    className={
                      i < data.plan_breakdown.length - 1
                        ? "border-b border-border/50"
                        : ""
                    }
                  >
                    <td className="py-3 pr-4 font-medium capitalize text-foreground">
                      {row.plan}
                    </td>
                    <td className="py-3 pr-4 capitalize text-muted-foreground">
                      {row.billing_interval}
                    </td>
                    <td className="py-3 pr-4 text-right text-foreground">
                      {row.count}
                    </td>
                    <td className="py-3 text-right font-medium text-foreground">
                      {formatCurrency(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Stripe Charges */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">
            Recent Stripe Charges (30d)
          </h3>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Description</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.stripe_charges_30d.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No charges in the last 30 days
                  </td>
                </tr>
              ) : (
                data.stripe_charges_30d.map((charge) => (
                  <tr key={charge.id} className="text-foreground">
                    <td className="whitespace-nowrap py-3 pr-4 text-muted-foreground">
                      {formatDate(charge.created)}
                    </td>
                    <td className="py-3 pr-4">
                      {charge.customer_email ?? "Unknown"}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {charge.description ?? "Subscription payment"}
                    </td>
                    <td className="py-3 text-right font-medium text-emerald-400">
                      {formatCurrency(charge.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stripe Balance */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground">
          Stripe Balance
        </h3>
        <p className="mt-2 text-3xl font-bold text-foreground">
          {formatCurrency(data.stripe_total_revenue)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Available + pending balance
        </p>
      </div>
    </div>
  );
}
