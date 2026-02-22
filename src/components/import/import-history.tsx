"use client";

import { useState, useTransition } from "react";
import { History, Trash2, X, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteImport } from "@/app/actions/trades";

export type ImportRecord = {
  id: string;
  filename: string;
  tradeCount: number;
  date: string;
};

type Props = {
  imports: ImportRecord[];
  onImportsChange?: (imports: ImportRecord[]) => void;
  onDelete?: () => void;
};

/* ─────── Confirm Dialog ─────── */
function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  filename,
  tradeCount,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  filename: string;
  tradeCount: number;
  loading: boolean;
}) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed inset-4 z-50 m-auto flex max-h-[280px] max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-0 zoom-in-95 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2">
        <div className="flex items-start gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-loss/10">
            <AlertTriangle className="h-5 w-5 text-loss" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground">
              Deletar importação?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Isso irá remover o arquivo{" "}
              <span className="font-medium text-foreground">{filename}</span>{" "}
              e todos os{" "}
              <span className="font-medium text-foreground">{tradeCount} trade{tradeCount !== 1 ? "s" : ""}</span>{" "}
              importados por ele. Essa ação não pode ser desfeita.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-loss px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-loss/90 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Deletar
          </button>
        </div>
      </div>
    </>
  );
}

/* ─────── Main Component ─────── */
export function ImportHistory({ imports, onImportsChange, onDelete }: Props) {
  const [confirmTarget, setConfirmTarget] = useState<ImportRecord | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirmTarget) return;
    const target = confirmTarget;

    startTransition(async () => {
      setError(null);
      const result = await deleteImport(target.id);
      if (result.error) {
        setError(result.error);
        setConfirmTarget(null);
        return;
      }
      // Remove da lista via callback para o pai
      onImportsChange?.(imports.filter((i) => i.id !== target.id));
      setConfirmTarget(null);
      onDelete?.();
    });
  }

  return (
    <div className="mt-6 border-t border-border pt-6">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Histórico de importação
        </h3>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-loss/10 p-3 text-sm text-loss">
          {error}
        </p>
      )}

      {imports.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Nenhuma importação realizada ainda.
        </p>
      ) : (
        <div className="max-h-[280px] overflow-y-auto rounded-lg border border-border">
          {imports.map((imp, i) => (
            <div
              key={imp.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50",
                i !== imports.length - 1 && "border-b border-border/50"
              )}
            >
              {/* Icon */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground" title={imp.filename}>
                  {imp.filename}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{imp.tradeCount} trade{imp.tradeCount !== 1 ? "s" : ""}</span>
                  <span className="text-border">·</span>
                  <span>{imp.date}</span>
                </div>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => setConfirmTarget(imp)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-loss/10 hover:text-loss"
                aria-label={`Deletar importação ${imp.filename}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmTarget != null}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
        filename={confirmTarget?.filename ?? ""}
        tradeCount={confirmTarget?.tradeCount ?? 0}
        loading={isPending}
      />
    </div>
  );
}
