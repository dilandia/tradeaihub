"use client";

import { useRouter } from "next/navigation";
import { FileText, ChevronDown } from "lucide-react";

export type ReportOption = {
  id: string;
  filename: string;
  date: string;
  account?: string;
  broker?: string;
};

type Props = {
  options: ReportOption[];
  activeId: string | null;
};

export function ReportSelector({ options, activeId }: Props) {
  const router = useRouter();

  if (options.length === 0) return null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === "all") {
      router.push("/");
    } else {
      router.push(`/?import=${val}`);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span className="hidden sm:inline">Relatório:</span>
      </div>
      <div className="relative">
        <select
          value={activeId ?? "all"}
          onChange={handleChange}
          className="h-9 appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-sm text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-score focus:ring-offset-2 focus:ring-offset-background"
        >
          <option value="all">Todos os trades</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.filename} — {o.date}
              {o.account ? ` (${o.account})` : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}
