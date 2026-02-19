"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Loader2, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { ServerAutocomplete } from "./server-autocomplete";
import type { TradingAccountSafe } from "@/lib/trading-accounts";
import {
  createTradingAccount,
  updateTradingAccount,
} from "@/app/actions/trading-accounts";

/* ─── Brokers populares ─── */
const BROKER_OPTIONS = [
  "MetaTrader 5",
  "MetaTrader 4",
  "FTMO",
  "IC Markets",
  "Pepperstone",
  "XM",
  "Exness",
  "TickMill",
  "RoboForex",
  "FBS",
  "OctaFX",
  "Outro",
];

const SYNC_INTERVALS = [
  { label: "15 minutos", value: 15 },
  { label: "30 minutos", value: 30 },
  { label: "1 hora", value: 60 },
  { label: "2 horas", value: 120 },
  { label: "4 horas", value: 240 },
  { label: "Somente manual", value: 0 },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (account: TradingAccountSafe) => void;
  onUpdated: (account: TradingAccountSafe) => void;
  editingAccount: TradingAccountSafe | null;
};

export function AccountFormModal({
  open,
  onClose,
  onCreated,
  onUpdated,
  editingAccount,
}: Props) {
  const { t } = useLanguage();
  const isEditing = editingAccount != null;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  /* ─── Form state ─── */
  const [accountName, setAccountName] = useState("");
  const [platform, setPlatform] = useState<"MT4" | "MT5">("MT5");
  const [broker, setBroker] = useState("MetaTrader 5");
  const [customBroker, setCustomBroker] = useState("");
  const [server, setServer] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [passwordType, setPasswordType] = useState<"investor" | "master">(
    "investor"
  );
  const [profitCalcMethod, setProfitCalcMethod] = useState<"FIFO" | "LIFO">(
    "FIFO"
  );
  const [syncInterval, setSyncInterval] = useState(60);

  /* Preencher ao editar */
  useEffect(() => {
    if (editingAccount) {
      setAccountName(editingAccount.account_name);
      setPlatform(editingAccount.platform);
      const isBrokerInList = BROKER_OPTIONS.includes(editingAccount.broker);
      setBroker(isBrokerInList ? editingAccount.broker : "Outro");
      setCustomBroker(isBrokerInList ? "" : editingAccount.broker);
      setServer(editingAccount.server);
      setLogin(editingAccount.login);
      setPassword(""); // never prefill password
      setPasswordType(editingAccount.password_type);
      setProfitCalcMethod(editingAccount.profit_calc_method);
      setSyncInterval(
        editingAccount.auto_sync_enabled
          ? editingAccount.sync_interval_minutes
          : 0
      );
    } else {
      resetForm();
    }
    setError(null);
  }, [editingAccount, open]);

  function resetForm() {
    setAccountName("");
    setPlatform("MT5");
    setBroker("MetaTrader 5");
    setCustomBroker("");
    setServer("");
    setLogin("");
    setPassword("");
    setPasswordType("investor");
    setProfitCalcMethod("FIFO");
    setSyncInterval(60);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const finalBroker = broker === "Outro" ? customBroker.trim() : broker;
    if (!finalBroker) {
      setError("Informe o nome do broker.");
      return;
    }
    if (!server.trim()) {
      setError("Informe o servidor.");
      return;
    }
    if (!/^\d{4,10}$/.test(login.trim())) {
      setError("Login deve ser numérico (4-10 dígitos).");
      return;
    }
    if (!isEditing && !password) {
      setError("Informe a senha.");
      return;
    }

    startTransition(async () => {
      try {
        if (isEditing) {
          const result = await updateTradingAccount({
            id: editingAccount!.id,
            account_name: accountName.trim(),
            platform,
            broker: finalBroker,
            server: server.trim(),
            login: login.trim(),
            password: password || undefined,
            password_type: passwordType,
            profit_calc_method: profitCalcMethod,
            sync_interval_minutes: syncInterval || 60,
            auto_sync_enabled: syncInterval > 0,
          });
          if (result.success && result.account) {
            onUpdated(result.account);
          } else {
            const msg = result.error?.startsWith("planErrors.") ? t(result.error) : result.error;
            setError(msg ?? "Erro ao atualizar conta.");
          }
        } else {
          const result = await createTradingAccount({
            account_name: accountName.trim() || `Conta ${platform}`,
            platform,
            broker: finalBroker,
            server: server.trim(),
            login: login.trim(),
            password,
            password_type: passwordType,
            profit_calc_method: profitCalcMethod,
            sync_interval_minutes: syncInterval || 60,
            auto_sync_enabled: syncInterval > 0,
          });
          if (result.success && result.account) {
            onCreated(result.account);
          } else {
            const msg = result.error?.startsWith("planErrors.") ? t(result.error) : result.error;
            setError(msg ?? "Erro ao criar conta.");
          }
        }
      } catch {
        setError("Erro inesperado. Tente novamente.");
      }
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar"
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Link2 className="h-5 w-5 text-score" />
            {isEditing ? "Editar conta" : "Adicionar conta"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account name */}
          <Field label="Nome da conta" htmlFor="accName">
            <input
              id="accName"
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Ex: Minha conta real"
              className={INPUT_CLASS}
            />
          </Field>

          {/* Platform */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Plataforma" htmlFor="platform">
              <select
                id="platform"
                value={platform}
                onChange={(e) =>
                  setPlatform(e.target.value as "MT4" | "MT5")
                }
                className={INPUT_CLASS}
              >
                <option value="MT4">MetaTrader 4</option>
                <option value="MT5">MetaTrader 5</option>
              </select>
            </Field>

            <Field label="Broker" htmlFor="broker">
              <select
                id="broker"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                className={INPUT_CLASS}
              >
                {BROKER_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {broker === "Outro" && (
            <Field label="Nome do broker" htmlFor="customBroker">
              <input
                id="customBroker"
                type="text"
                value={customBroker}
                onChange={(e) => setCustomBroker(e.target.value)}
                placeholder="Ex: MyBroker"
                className={INPUT_CLASS}
              />
            </Field>
          )}

          {/* Server + Login */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Servidor" htmlFor="server">
              <ServerAutocomplete
                id="server"
                value={server}
                onChange={setServer}
                platform={platform}
                placeholder="Digite para buscar..."
              />
              <p className="mt-1 text-[10px] text-muted-foreground/60">
                Comece a digitar para ver sugestões
              </p>
            </Field>
            <Field label="Login" htmlFor="login">
              <input
                id="login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value.replace(/\D/g, ""))}
                placeholder="Ex: 1234567"
                className={INPUT_CLASS}
                inputMode="numeric"
              />
            </Field>
          </div>

          {/* Password */}
          <div className="grid grid-cols-2 gap-4">
            <Field label={isEditing ? "Nova senha (opcional)" : "Senha"} htmlFor="password">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? "Deixe vazio para manter" : "Senha investidor/master"}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Tipo de senha" htmlFor="passwordType">
              <select
                id="passwordType"
                value={passwordType}
                onChange={(e) =>
                  setPasswordType(e.target.value as "investor" | "master")
                }
                className={INPUT_CLASS}
              >
                <option value="investor">Investidor (leitura)</option>
                <option value="master">Master</option>
              </select>
            </Field>
          </div>

          {/* Profit calc + Sync interval */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cálculo de lucro" htmlFor="profitCalc">
              <select
                id="profitCalc"
                value={profitCalcMethod}
                onChange={(e) =>
                  setProfitCalcMethod(e.target.value as "FIFO" | "LIFO")
                }
                className={INPUT_CLASS}
              >
                <option value="FIFO">FIFO</option>
                <option value="LIFO">LIFO</option>
              </select>
            </Field>
            <Field label="Intervalo de sync" htmlFor="syncInterval">
              <select
                id="syncInterval"
                value={syncInterval}
                onChange={(e) => setSyncInterval(Number(e.target.value))}
                className={INPUT_CLASS}
              >
                {SYNC_INTERVALS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium",
                "bg-score text-white transition-colors hover:bg-score/90",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar" : "Conectar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Shared styles ─── */

const INPUT_CLASS = cn(
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground",
  "placeholder:text-muted-foreground/50",
  "focus:outline-none focus:ring-2 focus:ring-score focus:ring-offset-1 focus:ring-offset-background",
  "transition-colors"
);

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
