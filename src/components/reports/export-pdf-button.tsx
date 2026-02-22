"use client";

import { Download, Loader2, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

interface ExportPdfButtonProps {
  onExport: () => void;
  isExporting: boolean;
  canExport: boolean;
  className?: string;
}

export function ExportPdfButton({
  onExport,
  isExporting,
  canExport,
  className,
}: ExportPdfButtonProps) {
  const { t } = useLanguage();

  if (!canExport) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground opacity-60 cursor-not-allowed",
          className
        )}
        title={t("planErrors.exportPdfFree")}
      >
        <Lock className="h-4 w-4" />
        {t("reports.exportPdf")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onExport}
      disabled={isExporting}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted",
        isExporting && "opacity-60 cursor-wait",
        className
      )}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {isExporting ? t("reports.exporting") : t("reports.exportPdf")}
    </button>
  );
}
