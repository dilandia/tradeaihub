"use client";

import { motion } from "framer-motion";
import { X, FileSpreadsheet, FileText, File } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

type Props = {
  file: File;
  onRemove: () => void;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "xlsx" || ext === "xls") return FileSpreadsheet;
  if (ext === "html" || ext === "htm") return FileText;
  return File;
}

export function FilePreviewChip({ file, onRemove }: Props) {
  const { t } = useLanguage();
  const Icon = getFileIcon(file.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="mt-2 rounded-lg border border-score/30 bg-score/5 px-3 py-2.5"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-8 w-8 shrink-0 text-score" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}{" "}
            <span className="text-profit">
              — {t("import.readyToImport")}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("import.removeFile")}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
