import { Metadata } from "next";
import {
  Ticket,
  Clock,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Bug,
  Lightbulb,
  CreditCard,
  UserCog,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { verifyAdmin } from "@/lib/admin-auth";
import { getAdminTickets, getAdminTicketStats } from "@/app/actions/admin-tickets";
import { StatCard } from "@/components/admin/stat-card";

export const metadata: Metadata = {
  title: "Support Tickets – Admin",
};

const STATUS_STYLES: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  open: { icon: Clock, color: "text-amber-400 bg-amber-400/10", label: "Open" },
  in_progress: { icon: PlayCircle, color: "text-blue-400 bg-blue-400/10", label: "In Progress" },
  resolved: { icon: CheckCircle2, color: "text-emerald-400 bg-emerald-400/10", label: "Resolved" },
  closed: { icon: XCircle, color: "text-red-400 bg-red-400/10", label: "Closed" },
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "text-blue-400 bg-blue-400/10",
  medium: "text-amber-400 bg-amber-400/10",
  high: "text-red-400 bg-red-400/10",
};

const CATEGORY_ICONS: Record<string, typeof Bug> = {
  bug: Bug,
  feature: Lightbulb,
  billing: CreditCard,
  account: UserCog,
  other: HelpCircle,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await verifyAdmin();

  const params = await searchParams;
  const statusFilter = params.status ?? "all";
  const [stats, tickets] = await Promise.all([
    getAdminTicketStats(),
    getAdminTickets(statusFilter),
  ]);

  const FILTERS = [
    { value: "all", label: "All", count: stats.total },
    { value: "open", label: "Open", count: stats.open },
    { value: "in_progress", label: "In Progress", count: stats.in_progress },
    { value: "resolved", label: "Resolved", count: stats.resolved },
    { value: "closed", label: "Closed", count: stats.closed },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Support Tickets
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage and respond to user support requests
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard title="Total" value={stats.total} icon={<Ticket className="h-4 w-4" />} />
        <StatCard title="Open" value={stats.open} icon={<Clock className="h-4 w-4" />} />
        <StatCard title="In Progress" value={stats.in_progress} icon={<PlayCircle className="h-4 w-4" />} />
        <StatCard title="Resolved" value={stats.resolved} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard title="Closed" value={stats.closed} icon={<XCircle className="h-4 w-4" />} />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/tickets" : `/admin/tickets?status=${f.value}`}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {f.label}
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">
              {f.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Ticket List */}
      {tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card py-12">
          <Ticket className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No tickets found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Priority</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map((t) => {
                const statusInfo = STATUS_STYLES[t.status] ?? STATUS_STYLES.open;
                const StatusIcon = statusInfo.icon;
                const CategoryIcon = CATEGORY_ICONS[t.category] ?? HelpCircle;
                return (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {t.ticket_number}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/tickets/${t.id}`}
                        className="font-medium text-foreground hover:text-indigo-400 transition-colors"
                      >
                        {t.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{t.user_name ?? t.user_email}</p>
                      {t.user_name && (
                        <p className="text-xs text-muted-foreground">{t.user_email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CategoryIcon className="mx-auto h-4 w-4 text-muted-foreground" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[t.priority]}`}>
                        {t.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {timeAgo(t.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
