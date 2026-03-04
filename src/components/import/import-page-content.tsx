"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { formatDate } from "@/lib/i18n/date-utils";
import { createTrade, importTradesFromFile } from "@/app/actions/trades";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { ImportHistory } from "@/components/import/import-history";
import { FilePreviewChip } from "@/components/import/file-preview-chip";
import { ImportProcessingOverlay } from "@/components/import/import-processing-overlay";
import type { ImportRecord } from "@/components/import/import-history";

type PlanLimits = {
  manualAccountsCount: number;
  maxManualAccounts: number;
  importsThisMonth: number;
  importLimitPerMonth: number;
};

type Props = {
  initialImports: ImportRecord[];
  planLimits: PlanLimits | null;
};

export function ImportPageContent({ initialImports, planLimits }: Props) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileSuccess, setFileSuccess] = useState<number | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [imports, setImports] = useState(initialImports);

  function handleManualSubmitEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    void runManualSubmit(formData);
  }

  async function runManualSubmit(formData: FormData) {
    setManualError(null);
    setManualSuccess(false);
    setManualLoading(true);
    try {
      const result = await createTrade(formData);
      if (result.error) {
        setManualError(result.error);
        return;
      }
      setManualSuccess(true);
      toast.success(t("import.tradeSaved"));
    } catch {
      setManualError("Erro inesperado. Tente novamente.");
    } finally {
      setManualLoading(false);
    }
  }

  function handleFileSubmitEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    void runFileSubmit(formData);
  }

  async function runFileSubmit(formData: FormData) {
    setFileError(null);
    setFileSuccess(null);
    setFileLoading(true);
    try {
      const result = await importTradesFromFile(formData);
      if (result.error) {
        setFileError(result.error.startsWith("planErrors.") ? t(result.error) : result.error);
        return;
      }
      const count = result.imported ?? 0;
      setFileSuccess(count);
      toast.success(t("import.importedCount", { count }));

      const fileName = selectedFile?.name ?? "Arquivo importado";
      const newRecord: ImportRecord = {
        id: result.importId ?? crypto.randomUUID(),
        filename: fileName,
        tradeCount: result.imported ?? 0,
        date: formatDate(new Date(), locale),
      };
      setImports((prev) => [newRecord, ...prev]);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch {
      setFileError("Erro inesperado ao importar. Tente novamente.");
    } finally {
      setFileLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setFileError(null);
    setFileSuccess(null);
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleImportAnother() {
    setFileSuccess(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <ImportProcessingOverlay open={fileLoading} />

      <header className="mb-6 flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex h-10 min-h-[44px] items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("import.back")}
        </Link>
        <h1 className="text-xl font-bold text-foreground md:text-2xl">
          {t("import.title")}
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Entrada manual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-5 w-5" />
              {t("import.manualEntry")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("import.manualEntryDesc")}
            </p>
          </CardHeader>
          <CardContent>
            {manualError && (
              <p className="mb-4 rounded-lg bg-loss/10 p-3 text-sm text-loss">
                {manualError}
              </p>
            )}
            {manualSuccess && (
              <p className="mb-4 rounded-lg bg-profit/10 p-3 text-sm text-profit">
                {t("import.tradeSaved")}
              </p>
            )}
            <form onSubmit={handleManualSubmitEvent} className="flex flex-col gap-4">
              <fieldset disabled={manualLoading} className="flex flex-col gap-4 border-0 p-0 m-0">
                <div>
                  <label htmlFor="trade_date" className="mb-1.5 block text-sm font-medium text-foreground">
                    {t("import.date")} *
                  </label>
                  <input
                    id="trade_date"
                    name="trade_date"
                    type="date"
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-score"
                  />
                </div>
                <div>
                  <label htmlFor="pair" className="mb-1.5 block text-sm font-medium text-foreground">
                    {t("import.pair")} *
                  </label>
                  <input
                    id="pair"
                    name="pair"
                    type="text"
                    required
                    placeholder={t("import.pairPlaceholder")}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-score"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="entry_price" className="mb-1.5 block text-sm font-medium text-foreground">
                      {t("import.entry")}
                    </label>
                    <input
                      id="entry_price"
                      name="entry_price"
                      type="number"
                      step="any"
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-score"
                    />
                  </div>
                  <div>
                    <label htmlFor="exit_price" className="mb-1.5 block text-sm font-medium text-foreground">
                      {t("import.exit")}
                    </label>
                    <input
                      id="exit_price"
                      name="exit_price"
                      type="number"
                      step="any"
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-score"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pips" className="mb-1.5 block text-sm font-medium text-foreground">
                      {t("import.pips")}
                    </label>
                    <input
                      id="pips"
                      name="pips"
                      type="number"
                      step="any"
                      placeholder="0"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-score"
                    />
                  </div>
                  <div>
                    <label htmlFor="is_win" className="mb-1.5 block text-sm font-medium text-foreground">
                      {t("import.result")}
                    </label>
                    <select
                      id="is_win"
                      name="is_win"
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-score"
                    >
                      <option value="true">{t("import.win")}</option>
                      <option value="false">{t("import.loss")}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="risk_reward" className="mb-1.5 block text-sm font-medium text-foreground">
                    {t("import.rr")}
                  </label>
                  <input
                    id="risk_reward"
                    name="risk_reward"
                    type="number"
                    step="0.1"
                    placeholder={t("import.rrPlaceholder")}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-score"
                  />
                </div>
                <div>
                  <label htmlFor="tags" className="mb-1.5 block text-sm font-medium text-foreground">
                    {t("import.tags")}
                  </label>
                  <input
                    id="tags"
                    name="tags"
                    type="text"
                    placeholder={t("import.tagsPlaceholder")}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-score"
                  />
                </div>
                <div>
                  <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-foreground">
                    {t("import.notes")}
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    placeholder={t("import.notesPlaceholder")}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-score"
                  />
                </div>
              </fieldset>
              <button
                type="submit"
                disabled={manualLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-score py-2.5 font-medium text-white transition-colors hover:bg-score/90 focus:outline-none focus:ring-2 focus:ring-score focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70"
              >
                {manualLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("import.saving")}
                  </>
                ) : (
                  t("import.saveTrade")
                )}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Upload CSV/Excel + Histórico */}
        <div className="flex flex-col gap-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-5 w-5" />
                {t("import.uploadCsv")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("import.uploadDesc")}
              </p>
            </CardHeader>
            <CardContent>
              {fileError && (
                <p className="mb-4 rounded-lg bg-loss/10 p-3 text-sm text-loss">
                  {fileError.startsWith("planErrors.") ? t(fileError) : fileError}
                </p>
              )}

              {/* Success banner */}
              <AnimatePresence>
                {fileSuccess !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="mb-4 rounded-lg border border-profit/30 bg-profit/5 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-profit" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {t("import.successTitle")}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t("import.importedCount", { count: fileSuccess })}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-score px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-score/90"
                          >
                            {t("import.viewTrades")}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={handleImportAnother}
                            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                          >
                            {t("import.importAnother")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {planLimits && (
                <div className="mb-4 flex flex-wrap gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <span>
                    {planLimits.maxManualAccounts >= 999
                      ? t("import.planLimitManualUnlimited", { current: planLimits.manualAccountsCount })
                      : t("import.planLimitManual", { current: planLimits.manualAccountsCount, max: planLimits.maxManualAccounts })}
                  </span>
                  <span className="text-border">|</span>
                  <span>
                    {planLimits.importLimitPerMonth >= 999
                      ? t("import.planLimitImportsUnlimited", { current: planLimits.importsThisMonth })
                      : t("import.planLimitImports", { current: planLimits.importsThisMonth, max: planLimits.importLimitPerMonth })}
                  </span>
                </div>
              )}

              <form onSubmit={handleFileSubmitEvent} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="file" className="mb-1.5 block text-sm font-medium text-foreground">
                    {t("import.file")}
                  </label>
                  <input
                    ref={fileInputRef}
                    id="file"
                    name="file"
                    type="file"
                    accept=".xlsx,.xls,.html,.htm"
                    required
                    disabled={fileLoading}
                    onChange={handleFileChange}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground file:mr-2 file:rounded file:border-0 file:bg-score file:px-3 file:py-1.5 file:text-white file:text-sm focus:outline-none focus:ring-2 focus:ring-score disabled:opacity-50"
                  />
                  <AnimatePresence>
                    {selectedFile && !fileLoading && (
                      <FilePreviewChip
                        file={selectedFile}
                        onRemove={handleRemoveFile}
                      />
                    )}
                  </AnimatePresence>
                </div>
                <button
                  type="submit"
                  disabled={fileLoading || !selectedFile}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-score py-2.5 font-medium text-white transition-colors hover:bg-score/90 focus:outline-none focus:ring-2 focus:ring-score focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Upload className="h-4 w-4" />
                  {t("import.importFile")}
                </button>
              </form>

              {/* Histórico de importação */}
              <ImportHistory
                imports={imports}
                onImportsChange={setImports}
                onDelete={() => router.refresh()}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
