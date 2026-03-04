import { Suspense } from "react";
import { ReportsNav } from "@/components/reports/reports-nav";
import { ReportsPlanGate } from "@/components/reports/reports-plan-gate";

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Suspense required: ReportsNav uses useSearchParams() */}
      <Suspense fallback={<div className="h-[49px] border-b border-border bg-card/50" />}>
        <ReportsNav />
      </Suspense>
      <div className="p-4 lg:p-6">
        <ReportsPlanGate>{children}</ReportsPlanGate>
      </div>
    </div>
  );
}
