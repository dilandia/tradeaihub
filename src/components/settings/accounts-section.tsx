"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Link2,
  RefreshCw,
  MoreVertical,
  Trash2,
  Pencil,
  Clock,
  AlertCircle,
  Eraser,
  Shield,
  Zap,
  BarChart3,
  Users,
  Cloud,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { AccountFormModal } from "./account-form-modal";
import { AccountActionsMenu } from "./account-actions-menu";
import type { TradingAccountSafe } from "@/lib/trading-accounts";
import {
  deleteTradingAccount,
  clearTradingAccountTrades,
  syncTradingAccount,
} from "@/app/actions/trading-accounts";

type Props = {
  accounts: TradingAccountSafe[];
};

/* ─── Status badge ─── */
const STATUS_KEYS: Record<string, string> = {
  connected: "settings.accountsPage.statusConnected",
  syncing: "settings.accountsPage.statusSyncing",
  error: "settings.accountsPage.statusError",
  disconnected: "settings.accountsPage.statusDisconnected",
};

const STATUS_COLORS: Record<string, { color: string; pulse?: boolean }> = {
  connected: { color: "bg-emerald-500" },
  syncing: { color: "bg-amber-500", pulse: true },
  error: { color: "bg-red-500" },
  disconnected: { color: "bg-zinc-500" },
};

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const key = STATUS_KEYS[status] ?? STATUS_KEYS.disconnected;
  const cfg = STATUS_COLORS[status] ?? STATUS_COLORS.disconnected;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          cfg.color,
          cfg.pulse && "animate-pulse"
        )}
      />
      {t(key)}
    </span>
  );
}

function TypeBadge({ autoSync, t }: { autoSync: boolean; t: (k: string) => string }) {
  return (
    <span
      className={cn(
        "rounded px-2 py-0.5 text-[11px] font-medium",
        autoSync
          ? "bg-score/10 text-score"
          : "bg-muted text-muted-foreground"
      )}
    >
      {autoSync ? t("settings.accountsPage.typeAutoSync") : t("settings.accountsPage.typeManual")}
    </span>
  );
}

const FEATURES = [
  { key: "settings.accountsPage.feature1", icon: RefreshCw },
  { key: "settings.accountsPage.feature2", icon: BarChart3 },
  { key: "settings.accountsPage.feature3", icon: Users },
  { key: "settings.accountsPage.feature4", icon: Cloud },
] as const;

export function AccountsSection({ accounts: initial }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccountSafe | null>(null);
  const [isPending, startTransition] = useTransition();

  /* ─── Callbacks ─── */
  function handleCreated(account: TradingAccountSafe) {
    setAccounts((prev) => [account, ...prev]);
    setModalOpen(false);
    setEditingAccount(null);
    toast.success("Conta adicionada", {
      description: `${account.account_name} foi vinculada com sucesso.`,
    });
  }

  function handleUpdated(account: TradingAccountSafe) {
    setAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? account : a))
    );
    setModalOpen(false);
    setEditingAccount(null);
    toast.success("Conta atualizada", {
      description: `${account.account_name} foi atualizada.`,
    });
  }

  function handleEdit(account: TradingAccountSafe) {
    setEditingAccount(account);
    setModalOpen(true);
  }

  function handleSync(accountId: string) {
    const accountName =
      accounts.find((a) => a.id === accountId)?.account_name ?? "Conta";

    // Optimistic: set syncing
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId ? { ...a, status: "syncing" as const } : a
      )
    );

    toast.loading(`Sincronizando ${accountName}...`, { id: `sync-${accountId}` });

    startTransition(async () => {
      const result = await syncTradingAccount(accountId);
      if (result.success && result.account) {
        setAccounts((prev) =>
          prev.map((a) => (a.id === accountId ? result.account! : a))
        );
        toast.success("Sincronização concluída", {
          id: `sync-${accountId}`,
          description: `${accountName} sincronizada com sucesso.`,
        });
      } else {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === accountId
              ? { ...a, status: "error" as const, error_message: result.error ?? null }
              : a
          )
        );
        toast.error("Falha na sincronização", {
          id: `sync-${accountId}`,
          description: result.error ?? "Erro desconhecido ao sincronizar.",
        });
      }
    });
  }

  function handleDelete(accountId: string) {
    const accountName =
      accounts.find((a) => a.id === accountId)?.account_name ?? "Conta";

    startTransition(async () => {
      const result = await deleteTradingAccount(accountId);
      if (result.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== accountId));
        router.refresh(); // Atualiza layout e dropdown do header
        toast.success("Conta removida", {
          description: `${accountName} e todos os trades vinculados foram deletados.`,
        });
      } else {
        toast.error("Erro ao deletar", {
          description: result.error ?? "Não foi possível deletar a conta.",
        });
      }
    });
  }

  function handleClearTrades(accountId: string) {
    const accountName =
      accounts.find((a) => a.id === accountId)?.account_name ?? "Conta";

    startTransition(async () => {
      const result = await clearTradingAccountTrades(accountId);
      if (result.success) {
        toast.success("Trades limpos", {
          description: `Todos os trades de ${accountName} foram removidos.`,
        });
      } else {
        toast.error("Erro ao limpar trades", {
          description: result.error ?? "Não foi possível limpar os trades.",
        });
      }
    });
  }

  const hasAccounts = accounts.length > 0;

  return (
    <div className="max-w-4xl">
      {/* ─── Header ─── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Link2 className="h-5 w-5 text-score" />
            {t("settings.accounts")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("settings.accountsPage.description")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingAccount(null);
            setModalOpen(true);
          }}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium",
            "bg-score text-white transition-all duration-200 hover:bg-score/90 hover:scale-[1.02]",
            "focus:outline-none focus:ring-2 focus:ring-score focus:ring-offset-2 focus:ring-offset-background"
          )}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("settings.accountsPage.addAccount")}</span>
        </button>
      </div>

      {/* ─── Table ─── */}
      {hasAccounts ? (
        <>
          {/* Desktop table */}
          <div className="hidden rounded-xl border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("settings.accountsPage.tableAccount")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("settings.accountsPage.tableBroker")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {t("settings.accountsPage.tableBalance")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("settings.accountsPage.tableLastSync")}
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    {t("settings.accountsPage.tableType")}
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    {t("settings.accountsPage.tableStatus")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {t("settings.accountsPage.tableActions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {a.account_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.platform} · {a.login}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{a.broker}</td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {a.currency === "USD" ? "$" : a.currency}{" "}
                      {Number(a.balance).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.last_sync_at
                        ? new Date(a.last_sync_at).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TypeBadge autoSync={a.auto_sync_enabled} t={t} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={a.status} t={t} />
                      {a.status === "error" && a.error_message && (
                        <span
                          className="ml-1 cursor-help text-red-400"
                          title={a.error_message}
                        >
                          <AlertCircle className="inline h-3.5 w-3.5" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AccountActionsMenu
                        account={a}
                        onEdit={() => handleEdit(a)}
                        onSync={() => handleSync(a.id)}
                        onClearTrades={() => handleClearTrades(a.id)}
                        onDelete={() => handleDelete(a.id)}
                        isPending={isPending}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {accounts.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {a.account_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.platform} · {a.broker} · {a.login}
                    </p>
                  </div>
                  <AccountActionsMenu
                    account={a}
                    onEdit={() => handleEdit(a)}
                    onSync={() => handleSync(a.id)}
                    onClearTrades={() => handleClearTrades(a.id)}
                    onDelete={() => handleDelete(a.id)}
                    isPending={isPending}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo</p>
                    <p className="font-mono text-sm font-medium text-foreground">
                      {a.currency === "USD" ? "$" : a.currency}{" "}
                      {Number(a.balance).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <TypeBadge autoSync={a.auto_sync_enabled} t={t} />
                    <StatusBadge status={a.status} t={t} />
                  </div>
                </div>
                {a.last_sync_at && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {t("settings.accountsPage.lastSync")}:{" "}
                    {new Date(a.last_sync_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <Link2 className="mb-4 h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-base font-medium text-foreground">
            {t("settings.accountsPage.emptyTitle")}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {t("settings.accountsPage.emptyDesc")}
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingAccount(null);
              setModalOpen(true);
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-score px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-score/90 hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            {t("settings.accountsPage.addAccount")}
          </button>
        </div>
      )}

      {/* ─── Como funciona, Recursos e Conexão segura ─── */}
      <div className="mt-10 grid gap-6 md:grid-cols-1">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Zap className="h-4 w-4 text-score" />
            {t("settings.accountsPage.howItWorks")}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t("settings.accountsPage.howItWorksDesc")}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <BarChart3 className="h-4 w-4 text-score" />
            {t("settings.accountsPage.features")}
          </h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {FEATURES.map(({ key, icon: Icon }) => (
              <li
                key={key}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground"
              >
                <Icon className="h-4 w-4 shrink-0 text-score" />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Shield className="h-4 w-4 text-score" />
            {t("settings.accountsPage.secureConnection")}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t("settings.accountsPage.secureDisclaimer")}
          </p>
        </div>
      </div>

      {/* ─── Modal ─── */}
      <AccountFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAccount(null);
        }}
        onCreated={handleCreated}
        onUpdated={handleUpdated}
        editingAccount={editingAccount}
      />
    </div>
  );
}
