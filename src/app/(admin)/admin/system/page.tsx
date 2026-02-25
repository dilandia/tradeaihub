import { unstable_cache } from "next/cache";
import {
  Activity,
  Database,
  Shield,
  HardDrive,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Scan,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bot,
} from "lucide-react";
import { getServiceClient } from "@/lib/admin-auth";
import { StatCard } from "@/components/admin/stat-card";

interface RlsRow {
  tablename: string;
  rowsecurity: boolean;
}

interface TableSizeRow {
  table_name: string;
  total_size: string;
  size_bytes: number;
  estimated_rows: number;
}

interface SystemHealthData {
  db_stats: {
    total_users: number;
    total_trades: number;
    total_imports: number;
    total_strategies: number;
    total_tags: number;
    total_conversations: number;
    total_messages: number;
  };
  signups_today: number;
  signups_7d: number;
  active_users_24h: number;
  active_users_7d: number;
  ai_cache_entries: number;
  ai_cache_expired: number;
  rls_status: RlsRow[];
  table_sizes: TableSizeRow[];
}

interface GuardianScanResult {
  id: string;
  scan_type: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  status: string;
  total_checks: number;
  events_found: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  auto_fixes_applied: number;
  ai_assessment: string | null;
}

interface GuardianEvent {
  id: string;
  severity: string;
  module: string;
  check_name: string;
  description: string;
  created_at: string;
}

interface GuardianStatus {
  last_scan: GuardianScanResult | null;
  unresolved_threats: number;
  critical_threats: number;
  recent_events: GuardianEvent[];
}

const getSystemHealth = unstable_cache(
  async (): Promise<SystemHealthData | null> => {
    const supabase = getServiceClient();
    const { data, error } = await supabase.rpc("admin_get_system_health");

    if (error) {
      console.error("[admin/system] RPC error:", error);
      return null;
    }

    return data as SystemHealthData;
  },
  ["admin-system"],
  { revalidate: 30 }
);

const getGuardianStatus = unstable_cache(
  async (): Promise<GuardianStatus | null> => {
    const supabase = getServiceClient();
    const { data, error } = await supabase.rpc("guardian_get_scan_status");

    if (error) {
      console.error("[admin/system] Guardian status error:", error);
      return null;
    }

    return data as GuardianStatus;
  },
  ["guardian-status"],
  { revalidate: 15 }
);

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getHeartbeatStatus(lastScan: GuardianScanResult | null): {
  status: "healthy" | "warning" | "critical" | "unknown";
  label: string;
} {
  if (!lastScan || !lastScan.completed_at) {
    return { status: "unknown", label: "No scans yet" };
  }
  const elapsed = Date.now() - new Date(lastScan.completed_at).getTime();
  const threeAndHalfHours = 3.5 * 60 * 60 * 1000;
  const sixHours = 6 * 60 * 60 * 1000;

  if (elapsed < threeAndHalfHours) {
    return { status: "healthy", label: "Online" };
  } else if (elapsed < sixHours) {
    return { status: "warning", label: "Delayed" };
  } else {
    return { status: "critical", label: "Offline" };
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "CRITICAL":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    case "HIGH":
      return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    case "MEDIUM":
      return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    case "LOW":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    default:
      return "text-muted-foreground bg-muted/50 border-border";
  }
}

function getVerdictFromScan(scan: GuardianScanResult): {
  label: string;
  color: string;
} {
  if (scan.critical_count > 0) {
    return { label: "THREATS DETECTED", color: "text-red-400" };
  }
  if (scan.high_count > 0) {
    return { label: "WARNINGS", color: "text-orange-400" };
  }
  if (scan.medium_count > 0) {
    return { label: "MINOR ISSUES", color: "text-amber-400" };
  }
  return { label: "ALL CLEAR", color: "text-emerald-400" };
}

export default async function AdminSystemPage() {
  const [data, guardian] = await Promise.all([
    getSystemHealth(),
    getGuardianStatus(),
  ]);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">
          Failed to load system health data. Check server logs.
        </p>
      </div>
    );
  }

  const sortedTables = [...data.table_sizes].sort(
    (a, b) => b.size_bytes - a.size_bytes
  );
  const rlsEnabled = data.rls_status.filter((r) => r.rowsecurity).length;
  const rlsTotal = data.rls_status.length;

  const heartbeat = getHeartbeatStatus(guardian?.last_scan ?? null);
  const heartbeatDot =
    heartbeat.status === "healthy"
      ? "bg-emerald-400"
      : heartbeat.status === "warning"
        ? "bg-amber-400"
        : heartbeat.status === "critical"
          ? "bg-red-400"
          : "bg-gray-400";

  const kpis = [
    {
      title: "Total Users",
      value: formatNumber(data.db_stats.total_users),
      icon: <Activity className="h-5 w-5" />,
    },
    {
      title: "Total Trades",
      value: formatNumber(data.db_stats.total_trades),
      icon: <Database className="h-5 w-5" />,
    },
    {
      title: "Signups Today",
      value: formatNumber(data.signups_today),
      icon: <Activity className="h-5 w-5" />,
      subtitle: `${formatNumber(data.signups_7d)} in last 7d`,
    },
    {
      title: "Active Users (24h)",
      value: formatNumber(data.active_users_24h),
      icon: <Activity className="h-5 w-5" />,
    },
    {
      title: "Active Users (7d)",
      value: formatNumber(data.active_users_7d),
      icon: <Activity className="h-5 w-5" />,
      subtitle:
        data.db_stats.total_users > 0
          ? `${Math.round((data.active_users_7d / data.db_stats.total_users) * 100)}% of total`
          : undefined,
    },
    {
      title: "AI Cache Entries",
      value: formatNumber(data.ai_cache_entries),
      icon: <HardDrive className="h-5 w-5" />,
      subtitle: `${formatNumber(data.ai_cache_expired)} expired`,
    },
  ];

  const dbStatsEntries: Array<{ label: string; value: number }> = [
    { label: "Users", value: data.db_stats.total_users },
    { label: "Trades", value: data.db_stats.total_trades },
    { label: "Imports", value: data.db_stats.total_imports },
    { label: "Strategies", value: data.db_stats.total_strategies },
    { label: "Tags", value: data.db_stats.total_tags },
    { label: "Conversations", value: data.db_stats.total_conversations },
    { label: "Messages", value: data.db_stats.total_messages },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          System Health
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Database stats, security status, and storage overview
        </p>
      </div>

      {/* ================================================================ */}
      {/* GUARDIAN SECURITY MONITOR */}
      {/* ================================================================ */}
      <div className="rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-card to-card p-6">
        {/* Header with heartbeat */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/15 p-2">
              <ShieldAlert className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  Sentinel Guardian
                </h2>
                <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-0.5">
                  <span
                    className={`h-2 w-2 rounded-full ${heartbeatDot} ${heartbeat.status === "healthy" ? "animate-pulse" : ""}`}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {heartbeat.label}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Automated security monitoring every 3 hours
              </p>
            </div>
          </div>
          {guardian?.last_scan?.completed_at && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Last scan</p>
              <p className="text-sm font-medium text-foreground">
                {timeAgo(guardian.last_scan.completed_at)}
              </p>
            </div>
          )}
        </div>

        {guardian ? (
          <>
            {/* Scan KPIs */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {/* Verdict */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-1.5">
                  <Scan className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">
                    Verdict
                  </p>
                </div>
                {guardian.last_scan ? (
                  <p
                    className={`mt-1 text-sm font-bold ${getVerdictFromScan(guardian.last_scan).color}`}
                  >
                    {getVerdictFromScan(guardian.last_scan).label}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    No data
                  </p>
                )}
              </div>

              {/* Unresolved Threats */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">
                    Unresolved
                  </p>
                </div>
                <p
                  className={`mt-1 text-lg font-bold ${guardian.unresolved_threats > 0 ? "text-orange-400" : "text-emerald-400"}`}
                >
                  {guardian.unresolved_threats}
                </p>
              </div>

              {/* Critical */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">
                    Critical
                  </p>
                </div>
                <p
                  className={`mt-1 text-lg font-bold ${guardian.critical_threats > 0 ? "text-red-400" : "text-emerald-400"}`}
                >
                  {guardian.critical_threats}
                </p>
              </div>

              {/* Duration */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">
                    Duration
                  </p>
                </div>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {guardian.last_scan?.duration_ms
                    ? `${(guardian.last_scan.duration_ms / 1000).toFixed(1)}s`
                    : "—"}
                </p>
              </div>

              {/* Auto-fixes */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">
                    Auto-fixes
                  </p>
                </div>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {guardian.last_scan?.auto_fixes_applied ?? 0}
                </p>
              </div>
            </div>

            {/* AI Heartbeat Assessment */}
            {guardian.last_scan?.ai_assessment && (
              <div className="mt-5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    AI Heartbeat
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    gpt-4o-mini
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {guardian.last_scan.ai_assessment}
                </p>
              </div>
            )}

            {/* Recent Events Log */}
            {guardian.recent_events.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  Active Threats & Warnings
                </h3>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {guardian.recent_events.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
                    >
                      <span
                        className={`mt-0.5 inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none ${getSeverityColor(evt.severity)}`}
                      >
                        {evt.severity}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">
                          {evt.description}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {evt.module} / {evt.check_name}
                          {evt.created_at && (
                            <span className="ml-2">
                              {formatDate(evt.created_at)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Clear Message */}
            {guardian.recent_events.length === 0 && (
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-400">
                  All clear — no unresolved security events
                </p>
              </div>
            )}

            {/* Last Scan Details */}
            {guardian.last_scan && (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
                <span>
                  Scan ID: {guardian.last_scan.id.slice(0, 8)}...
                </span>
                <span>Type: {guardian.last_scan.scan_type}</span>
                <span>Checks: {guardian.last_scan.total_checks}</span>
                <span>Events: {guardian.last_scan.events_found}</span>
                {guardian.last_scan.started_at && (
                  <span>
                    Started: {formatDate(guardian.last_scan.started_at)}
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-8 text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Guardian has not run any scans yet. The first scan will run
              automatically via cron.
            </p>
          </div>
        )}
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

      {/* Database Stats */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Database Stats
          </h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dbStatsEntries.map((entry) => (
            <div
              key={entry.label}
              className="rounded-lg border border-border bg-muted/50 p-4"
            >
              <p className="text-sm text-muted-foreground">{entry.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {formatNumber(entry.value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Cache */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">AI Cache</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Total Entries</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {formatNumber(data.ai_cache_entries)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Expired Entries</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {formatNumber(data.ai_cache_expired)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Active Entries</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {formatNumber(data.ai_cache_entries - data.ai_cache_expired)}
            </p>
          </div>
        </div>
      </div>

      {/* RLS Status */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              RLS Status
            </h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {rlsEnabled}/{rlsTotal} tables protected
          </span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 pr-4 font-medium text-muted-foreground">
                  Table
                </th>
                <th className="pb-3 font-medium text-muted-foreground">
                  RLS Enabled
                </th>
              </tr>
            </thead>
            <tbody>
              {data.rls_status.map((row) => (
                <tr key={row.tablename} className="border-b border-border/50">
                  <td className="py-3 pr-4 font-mono text-foreground">
                    {row.tablename}
                  </td>
                  <td className="py-3">
                    {row.rowsecurity ? (
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <ShieldX className="h-5 w-5 text-red-400" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Sizes */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Table Sizes
          </h2>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 pr-4 font-medium text-muted-foreground">
                  Table
                </th>
                <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                  Total Size
                </th>
                <th className="pb-3 text-right font-medium text-muted-foreground">
                  Est. Rows
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTables.map((row) => (
                <tr key={row.table_name} className="border-b border-border/50">
                  <td className="py-3 pr-4 font-mono text-foreground">
                    {row.table_name}
                  </td>
                  <td className="py-3 pr-4 text-right text-muted-foreground">
                    {row.total_size}
                  </td>
                  <td className="py-3 text-right text-muted-foreground">
                    {formatNumber(row.estimated_rows)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
