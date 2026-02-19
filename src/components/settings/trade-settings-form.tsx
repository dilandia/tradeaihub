"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  Eye,
  Calendar,
  Target,
  ShieldAlert,
  Clock,
  TrendingUp,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  updateTradePreferences,
  type TradePreferences,
} from "@/app/actions/trade-settings";

/* ─── Field Component ─── */

function Field({
  label,
  icon: Icon,
  children,
  description,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </label>
      {children}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3"
    >
      <div
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-score" : "bg-muted"
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </div>
      <span className="text-sm text-foreground">{label}</span>
    </button>
  );
}

/* ─── Main Component ─── */

type Props = { preferences: TradePreferences };

export function TradeSettingsForm({ preferences }: Props) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState<TradePreferences>({ ...preferences });

  const hasChanges = JSON.stringify(form) !== JSON.stringify(preferences);

  function update<K extends keyof TradePreferences>(key: K, value: TradePreferences[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    setStatus("idle");
    startTransition(async () => {
      const result = await updateTradePreferences(form);
      if (result.success) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setErrorMsg(result.error ?? "Erro ao salvar.");
      }
    });
  }

  function handleReset() {
    setForm({ ...preferences });
    setStatus("idle");
  }

  const selectClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-score transition-colors appearance-none cursor-pointer";

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-score transition-colors";

  return (
    <div className="space-y-6">
      {/* ─── Visualização ─── */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Visualização padrão
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Modo de exibição"
              icon={Eye}
              description="Como os valores são mostrados no dashboard"
            >
              <select
                value={form.default_view_mode}
                onChange={(e) => update("default_view_mode", e.target.value)}
                className={selectClass}
              >
                <option value="dollar">Dólar ($$)</option>
                <option value="pips">Pips</option>
                <option value="percentage">Porcentagem (%)</option>
                <option value="privacy">Privacidade (•••)</option>
              </select>
            </Field>

            <Field
              label="Período padrão"
              icon={Calendar}
              description="Período que carrega ao abrir o dashboard"
            >
              <select
                value={form.default_time_range}
                onChange={(e) => update("default_time_range", e.target.value)}
                className={selectClass}
              >
                <option value="7d">7 dias</option>
                <option value="14d">14 dias</option>
                <option value="30d">30 dias</option>
                <option value="90d">90 dias</option>
                <option value="180d">180 dias</option>
                <option value="365d">1 ano</option>
                <option value="all">Todos</option>
              </select>
            </Field>

            <Field
              label="Tipo de gráfico"
              icon={BarChart3}
              description="Gráfico padrão para P&L cumulativo"
            >
              <select
                value={form.default_chart_type}
                onChange={(e) => update("default_chart_type", e.target.value)}
                className={selectClass}
              >
                <option value="area">Área</option>
                <option value="line">Linha</option>
                <option value="bar">Barras</option>
              </select>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ─── Calendário ─── */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Calendário
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Início da semana"
              icon={Calendar}
              description="Qual dia inicia a semana no calendário"
            >
              <select
                value={form.week_start}
                onChange={(e) => update("week_start", e.target.value)}
                className={selectClass}
              >
                <option value="sunday">Domingo</option>
                <option value="monday">Segunda-feira</option>
              </select>
            </Field>

            <div className="flex items-end">
              <Toggle
                checked={form.show_weekends}
                onChange={(v) => update("show_weekends", v)}
                label="Mostrar fins de semana no calendário"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Risk Management ─── */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Gestão de risco
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Risco por trade (%)"
              icon={Target}
              description="Percentual padrão de risco por operação"
            >
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={form.risk_per_trade}
                onChange={(e) => update("risk_per_trade", Number(e.target.value))}
                className={inputClass}
              />
            </Field>

            <Field
              label="Risk/Reward padrão"
              icon={TrendingUp}
              description="Relação risco/retorno desejada"
            >
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={form.default_risk_reward}
                onChange={(e) => update("default_risk_reward", Number(e.target.value))}
                className={inputClass}
              />
            </Field>

            <Field
              label="Loss máximo diário ($)"
              icon={ShieldAlert}
              description="Alerta ao atingir esse valor de perda no dia. Deixe vazio para desativar."
            >
              <input
                type="number"
                step="10"
                min="0"
                value={form.max_daily_loss ?? ""}
                onChange={(e) =>
                  update("max_daily_loss", e.target.value ? Number(e.target.value) : null)
                }
                placeholder="Ex: 200"
                className={inputClass}
              />
            </Field>

            <Field
              label="Máximo de trades por dia"
              icon={BarChart3}
              description="Limite de operações diárias. Deixe vazio para sem limite."
            >
              <input
                type="number"
                step="1"
                min="1"
                max="1000"
                value={form.max_daily_trades ?? ""}
                onChange={(e) =>
                  update("max_daily_trades", e.target.value ? Number(e.target.value) : null)
                }
                placeholder="Ex: 10"
                className={inputClass}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ─── Trading Session ─── */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Sessão de trading
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Sessão principal"
              icon={Clock}
              description="Sessão de mercado que você mais opera"
            >
              <select
                value={form.trading_session}
                onChange={(e) => update("trading_session", e.target.value)}
                className={selectClass}
              >
                <option value="all">Todas as sessões</option>
                <option value="london">London (08:00-17:00 GMT)</option>
                <option value="newyork">New York (13:00-22:00 GMT)</option>
                <option value="tokyo">Tokyo (00:00-09:00 GMT)</option>
                <option value="sydney">Sydney (22:00-07:00 GMT)</option>
                <option value="custom">Personalizado</option>
              </select>
            </Field>

            {form.trading_session === "custom" && (
              <>
                <Field label="Hora de início" icon={Clock}>
                  <select
                    value={form.session_start_hour}
                    onChange={(e) => update("session_start_hour", Number(e.target.value))}
                    className={selectClass}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Hora de fim" icon={Clock}>
                  <select
                    value={form.session_end_hour}
                    onChange={(e) => update("session_end_hour", Number(e.target.value))}
                    className={selectClass}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Calculation ─── */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Cálculos
          </h3>
          <div className="max-w-sm">
            <Field
              label="Método de cálculo de lucro"
              icon={TrendingUp}
              description="FIFO: first-in first-out (padrão). LIFO: last-in first-out."
            >
              <select
                value={form.profit_calc_method}
                onChange={(e) => update("profit_calc_method", e.target.value)}
                className={selectClass}
              >
                <option value="FIFO">FIFO (First In, First Out)</option>
                <option value="LIFO">LIFO (Last In, First Out)</option>
              </select>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ─── Actions ─── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isPending}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-all",
            hasChanges && !isPending
              ? "bg-score hover:bg-score/90 shadow-sm"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isPending ? "Salvando..." : "Salvar preferências"}
        </button>

        {hasChanges && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Desfazer alterações
          </button>
        )}

        {status === "success" && (
          <span className="inline-flex items-center gap-1.5 text-sm text-profit">
            <CheckCircle className="h-4 w-4" />
            Preferências salvas!
          </span>
        )}
        {status === "error" && (
          <span className="inline-flex items-center gap-1.5 text-sm text-loss">
            <AlertCircle className="h-4 w-4" />
            {errorMsg}
          </span>
        )}
      </div>
    </div>
  );
}
