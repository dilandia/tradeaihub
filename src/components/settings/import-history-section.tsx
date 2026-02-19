"use client";

import { useState, useTransition } from "react";
import { useLanguage } from "@/contexts/language-context";
import { formatDate } from "@/lib/i18n/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Download,
  Upload,
  Calendar,
  Hash,
  FileSpreadsheet,
  Globe,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteImport } from "@/app/actions/trades";
import Link from "next/link";

/* ─── Types ─── */

type ImportItem = {
  id: string;
  filename: string;
  tradeCount: number;
  date: string;
  createdAt: string;
};

type Props = { imports: ImportItem[] };

/* ─── File Icon Helper ─── */

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "html" || ext === "htm")
    return <Globe className="h-5 w-5 text-blue-400" />;
  if (ext === "xlsx" || ext === "xls")
    return <FileSpreadsheet className="h-5 w-5 text-profit" />;
  return <FileText className="h-5 w-5 text-score" />;
}

/* ─── Main Component ─── */

export function ImportHistorySection({ imports: initialImports }: Props) {
  const { locale } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [imports, setImports] = useState(initialImports);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteImport(id);
      if (!result.error) {
        setImports((prev) => prev.filter((i) => i.id !== id));
        setDeleteConfirm(null);
        setStatus("success");
        setStatusMsg("Importação removida com sucesso.");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setStatusMsg(result.error);
      }
      setDeletingId(null);
    });
  }

  const totalTrades = imports.reduce((s, i) => s + i.tradeCount, 0);

  return (
    <div className="space-y-6">
      {/* ─── Status ─── */}
      {status !== "idle" && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-3 text-sm",
            status === "success" ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
          )}
        >
          {status === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {statusMsg}
        </div>
      )}

      {/* ─── Stats ─── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-score/10">
              <Upload className="h-5 w-5 text-score" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {imports.length}
              </p>
              <p className="text-xs text-muted-foreground">Importações</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-profit/10">
              <Hash className="h-5 w-5 text-profit" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {totalTrades}
              </p>
              <p className="text-xs text-muted-foreground">Trades importados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {imports.length > 0
                  ? formatDate(imports[0].createdAt, locale)
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Última importação</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Import List ─── */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Arquivos importados
            </h3>
            <Link
              href="/import"
              className="inline-flex items-center gap-1.5 rounded-lg bg-score px-3 py-1.5 text-xs font-medium text-white hover:bg-score/90 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Importar novo
            </Link>
          </div>

          {imports.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/20" />
              <p className="text-sm font-medium text-muted-foreground">
                Nenhuma importação realizada
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Importe relatórios MT4/MT5 para começar a analisar suas
                operações.
              </p>
              <Link
                href="/import"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-score px-4 py-2 text-sm font-medium text-white hover:bg-score/90 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Importar arquivo
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {imports.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between rounded-lg bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <FileIcon name={item.filename} />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.filename}
                      </p>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {item.tradeCount} trades
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.createdAt, locale)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {deleteConfirm === item.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-loss">Remover?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={isPending && deletingId === item.id}
                          className="rounded bg-loss px-2.5 py-1 text-xs font-medium text-white hover:bg-loss/90 transition-colors"
                        >
                          {isPending && deletingId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Sim"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(null)}
                          className="rounded bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(item.id)}
                        className="rounded p-1.5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-loss/10 hover:text-loss"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Info ─── */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Sobre importações
          </h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              <strong>Formatos aceitos:</strong> CSV, XLSX, XLS e HTML exportados
              do MetaTrader 4 ou 5.
            </p>
            <p>
              <strong>Ao deletar:</strong> Todos os trades vinculados àquela
              importação serão permanentemente removidos.
            </p>
            <p>
              <strong>Duplicatas:</strong> Ao reimportar o mesmo arquivo, trades
              duplicados não serão criados.
            </p>
            <p>
              <strong>Contas vinculadas:</strong> Trades de contas MT4/MT5
              conectadas via MetaApi não aparecem aqui — use a seção &quot;Contas&quot; para
              gerenciá-los.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
