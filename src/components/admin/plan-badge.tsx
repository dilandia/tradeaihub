import { cn } from "@/lib/utils";

interface PlanBadgeProps {
  plan: string;
  className?: string;
}

const planStyles: Record<string, string> = {
  free: "bg-slate-500/15 text-slate-400",
  pro: "bg-indigo-500/15 text-indigo-400",
  elite: "bg-purple-500/15 text-purple-400",
};

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const normalized = (plan ?? "free").toLowerCase();
  const style = planStyles[normalized] ?? planStyles.free;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        style,
        className
      )}
    >
      {normalized}
    </span>
  );
}
