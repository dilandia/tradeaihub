import { unstable_cache } from "next/cache";
import { Mail, Send, Eye, MousePointerClick, Globe, CheckCircle2 } from "lucide-react";
import { getServiceClient, verifyAdmin } from "@/lib/admin-auth";
import { StatCard } from "@/components/admin/stat-card";
import { Resend } from "resend";

/* ---------- Types ---------- */

interface EmailTypeStats {
  email_type: string;
  total: number;
  opened: number;
  clicked: number;
}

interface RecentEmail {
  id: string;
  user_id: string;
  user_email: string;
  email_type: string;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
}

interface OptInStats {
  onboarding: number;
  marketing: number;
  product_updates: number;
  total: number;
}

interface ResendDomainInfo {
  name: string;
  status: string;
  created_at: string;
}

interface EmailPageData {
  /* Supabase tracked data */
  total_sent: number;
  sent_30d: number;
  opened_30d: number;
  clicked_30d: number;
  by_type: EmailTypeStats[];
  recent: RecentEmail[];
  opt_in_stats: OptInStats;
  /* Resend API data */
  resend_domains: ResendDomainInfo[];
  resend_recent_emails: Array<{
    id: string;
    to: string;
    subject: string;
    created_at: string;
    last_event: string;
  }>;
}

/* ---------- Helpers ---------- */

function formatRate(numerator: number, denominator: number): string {
  if (denominator === 0) return "0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEmailType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ---------- Data fetching ---------- */

const getEmailData = unstable_cache(
  async (): Promise<EmailPageData | null> => {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY!);

      /* Parallel: Resend API + Supabase RPC */
      const [domainsRes, emailsRes, supabaseData] = await Promise.all([
        /* Resend: list domains */
        resend.domains.list().catch(() => ({ data: null })),
        /* Resend: list recent emails */
        resend.emails.list().catch(() => ({ data: null })),
        /* Supabase RPC */
        (async () => {
          const supabase = getServiceClient();
          const { data } = await supabase.rpc("admin_get_email_stats");
          return data;
        })(),
      ]);

      /* Map Resend domains */
      const resendDomains: ResendDomainInfo[] = [];
      if (domainsRes.data && Array.isArray(domainsRes.data)) {
        for (const d of domainsRes.data) {
          resendDomains.push({
            name: d.name,
            status: d.status,
            created_at: d.created_at,
          });
        }
      }

      /* Map Resend recent emails */
      const resendEmails: EmailPageData["resend_recent_emails"] = [];
      if (emailsRes.data && Array.isArray((emailsRes.data as { data?: unknown[] }).data)) {
        const emailList = (emailsRes.data as { data: Array<{ id: string; to: string[]; subject: string; created_at: string; last_event: string }> }).data;
        for (const e of emailList.slice(0, 20)) {
          resendEmails.push({
            id: e.id,
            to: Array.isArray(e.to) ? e.to.join(", ") : String(e.to),
            subject: e.subject ?? "",
            created_at: e.created_at,
            last_event: e.last_event ?? "sent",
          });
        }
      }

      return {
        total_sent: supabaseData?.total_sent ?? 0,
        sent_30d: supabaseData?.sent_30d ?? 0,
        opened_30d: supabaseData?.opened_30d ?? 0,
        clicked_30d: supabaseData?.clicked_30d ?? 0,
        by_type: supabaseData?.by_type ?? [],
        recent: supabaseData?.recent ?? [],
        opt_in_stats: supabaseData?.opt_in_stats ?? {
          onboarding: 0,
          marketing: 0,
          product_updates: 0,
          total: 0,
        },
        resend_domains: resendDomains,
        resend_recent_emails: resendEmails,
      };
    } catch (err) {
      console.error("[admin/emails] Error:", err);
      return null;
    }
  },
  ["admin-emails-resend"],
  { revalidate: 120 }
);

/* ---------- Status badge ---------- */

const eventColors: Record<string, string> = {
  delivered: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
  opened: "text-blue-400 bg-blue-500/15 border-blue-500/30",
  clicked: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30",
  bounced: "text-red-400 bg-red-500/15 border-red-500/30",
  complained: "text-orange-400 bg-orange-500/15 border-orange-500/30",
  sent: "text-slate-400 bg-slate-500/15 border-slate-500/30",
};

function EventBadge({ event }: { event: string }) {
  const cls = eventColors[event] ?? eventColors.sent;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {event}
    </span>
  );
}

/* ---------- Page ---------- */

export default async function AdminEmailsPage() {
  await verifyAdmin();
  const data = await getEmailData();

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">
          Failed to load email data. Check server logs.
        </p>
      </div>
    );
  }

  const openRate = formatRate(data.opened_30d, data.sent_30d);
  const clickRate = formatRate(data.clicked_30d, data.sent_30d);

  const kpis = [
    {
      title: "Total Sent",
      value: data.total_sent.toLocaleString(),
      icon: <Mail className="h-5 w-5" />,
      subtitle: "All time (tracked)",
    },
    {
      title: "Sent (30d)",
      value: data.sent_30d.toLocaleString(),
      icon: <Send className="h-5 w-5" />,
    },
    {
      title: "Open Rate (30d)",
      value: openRate,
      icon: <Eye className="h-5 w-5" />,
      subtitle: `${data.opened_30d} of ${data.sent_30d} opened`,
    },
    {
      title: "Click Rate (30d)",
      value: clickRate,
      icon: <MousePointerClick className="h-5 w-5" />,
      subtitle: `${data.clicked_30d} of ${data.sent_30d} clicked`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-500/15 p-2">
          <Mail className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Emails
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time data from Resend API + Supabase tracking
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
            subtitle={kpi.subtitle}
          />
        ))}
      </div>

      {/* Resend Domains Status */}
      {data.resend_domains.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Resend Domains
            </h3>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {data.resend_domains.map((domain) => (
              <div
                key={domain.name}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4"
              >
                <div>
                  <p className="font-mono text-sm font-medium text-foreground">
                    {domain.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Created {formatDate(domain.created_at)}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium ${
                    domain.status === "verified"
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {domain.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resend Recent Emails (Real API data) */}
      {data.resend_recent_emails.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Recent Emails (Resend API)
            </h3>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4">To</th>
                  <th className="pb-3 pr-4">Subject</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.resend_recent_emails.map((email) => (
                  <tr key={email.id} className="text-foreground">
                    <td className="py-3 pr-4 text-xs">{email.to}</td>
                    <td className="max-w-[200px] truncate py-3 pr-4 text-xs text-muted-foreground">
                      {email.subject}
                    </td>
                    <td className="py-3 pr-4">
                      <EventBadge event={email.last_event} />
                    </td>
                    <td className="whitespace-nowrap py-3 text-xs text-muted-foreground">
                      {formatDate(email.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Email Type Breakdown (Supabase) */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground">
          Breakdown by Type (Tracked)
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Type</th>
                <th className="pb-3 pr-4 text-right font-medium">Total</th>
                <th className="pb-3 pr-4 text-right font-medium">Opened</th>
                <th className="pb-3 pr-4 text-right font-medium">Clicked</th>
                <th className="pb-3 pr-4 text-right font-medium">Open Rate</th>
                <th className="pb-3 text-right font-medium">Click Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.by_type.map((row) => (
                <tr key={row.email_type} className="border-b border-border/50">
                  <td className="py-3 pr-4 font-medium text-foreground">
                    {formatEmailType(row.email_type)}
                  </td>
                  <td className="py-3 pr-4 text-right text-foreground">
                    {row.total.toLocaleString()}
                  </td>
                  <td className="py-3 pr-4 text-right text-foreground">
                    {row.opened.toLocaleString()}
                  </td>
                  <td className="py-3 pr-4 text-right text-foreground">
                    {row.clicked.toLocaleString()}
                  </td>
                  <td className="py-3 pr-4 text-right text-foreground">
                    {formatRate(row.opened, row.total)}
                  </td>
                  <td className="py-3 text-right text-foreground">
                    {formatRate(row.clicked, row.total)}
                  </td>
                </tr>
              ))}
              {data.by_type.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No email type data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Opt-in Stats */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground">
          Email Opt-in Stats
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Onboarding
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {data.opt_in_stats.onboarding.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatRate(data.opt_in_stats.onboarding, data.opt_in_stats.total)}{" "}
              of users
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Marketing
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {data.opt_in_stats.marketing.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatRate(data.opt_in_stats.marketing, data.opt_in_stats.total)}{" "}
              of users
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Product Updates
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {data.opt_in_stats.product_updates.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatRate(
                data.opt_in_stats.product_updates,
                data.opt_in_stats.total
              )}{" "}
              of users
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
