import { ReportsNav } from "@/components/reports/reports-nav";
import { ReportsPlanGate } from "@/components/reports/reports-plan-gate";

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <ReportsNav />
      <div className="p-4 lg:p-6">
        <ReportsPlanGate>{children}</ReportsPlanGate>
      </div>
    </div>
  );
}
