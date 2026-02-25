"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SignupDataPoint {
  day: string;
  count: number;
}

interface OverviewChartsProps {
  signups30d: SignupDataPoint[];
  plans: {
    free: number;
    pro: number;
    elite: number;
  };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{label ? formatDate(label) : ""}</p>
      <p className="text-sm font-semibold text-foreground">
        {payload[0].value} signup{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

function SignupsChart({ data }: { data: SignupDataPoint[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground">Signups (Last 30 Days)</h3>
      <div className="mt-4 h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="day"
              tickFormatter={formatDate}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#818cf8"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#818cf8", stroke: "#312e81", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PlanDistribution({ plans }: { plans: OverviewChartsProps["plans"] }) {
  const total = plans.free + plans.pro + plans.elite;
  if (total === 0) return null;

  const items = [
    { label: "Free", count: plans.free, color: "bg-zinc-500" },
    { label: "Pro", count: plans.pro, color: "bg-indigo-500" },
    { label: "Elite", count: plans.elite, color: "bg-amber-500" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground">Plan Distribution</h3>
      <div className="mt-4 space-y-4">
        {items.map((item) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{item.label}</span>
                <span className="text-muted-foreground">
                  {item.count} ({pct}%)
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${item.color} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OverviewCharts({ signups30d, plans }: OverviewChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SignupsChart data={signups30d} />
      <PlanDistribution plans={plans} />
    </div>
  );
}
