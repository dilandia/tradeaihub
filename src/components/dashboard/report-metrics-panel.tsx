"use client";

import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Target,
  AlertTriangle,
  Trophy,
  XCircle,
} from "lucide-react";

export type ReportMetrics = {
  totalNetProfit: number | null;
  grossProfit: number | null;
  grossLoss: number | null;
  profitFactor: number | null;
  expectedPayoff: number | null;
  recoveryFactor: number | null;
  sharpeRatio: number | null;
  drawdownAbsolute: number | null;
  drawdownMaximal: number | null;
  drawdownMaximalPct: number | null;
  drawdownRelativePct: number | null;
  drawdownRelative: number | null;
  totalTrades: number | null;
  shortTrades: number | null;
  shortTradesWonPct: number | null;
  longTrades: number | null;
  longTradesWonPct: number | null;
  profitTrades: number | null;
  profitTradesPct: number | null;
  lossTrades: number | null;
  lossTradesPct: number | null;
  largestProfit: number | null;
  largestLoss: number | null;
  avgProfit: number | null;
  avgLoss: number | null;
  maxConsWins: number | null;
  maxConsWinsMoney: number | null;
  maxConsLosses: number | null;
  maxConsLossesMoney: number | null;
  accountName: string | null;
  broker: string | null;
  importedCount: number | null;
};

type Props = {
  data: ReportMetrics;
  privacy?: boolean;
};

const HIDDEN = "•••";

function fmt(val: number | null, decimals = 2, hide = false): string {
  if (hide) return HIDDEN;
  if (val == null) return "—";
  return val.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtPct(val: number | null, hide = false): string {
  if (hide) return HIDDEN;
  if (val == null) return "—";
  return `${fmt(val)}%`;
}

function fmtMoney(val: number | null, hide = false): string {
  if (hide) return HIDDEN;
  if (val == null) return "—";
  const sign = val >= 0 ? "+" : "";
  return `${sign}${fmt(val)}`;
}

function StatItem({ label, value, sub, variant }: {
  label: string;
  value: string;
  sub?: string;
  variant?: "profit" | "loss" | "neutral";
}) {
  const color =
    variant === "profit" ? "text-profit" :
    variant === "loss" ? "text-loss" :
    "text-foreground";

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-2">
      <Icon className="h-4 w-4 text-score" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

export function ReportMetricsPanel({ data, privacy = false }: Props) {
  const netVariant = (data.totalNetProfit ?? 0) >= 0 ? "profit" : "loss";
  const h = privacy; // shorthand: hide monetary values

  return (
    <div className="space-y-5">
      {/* Account Info (se disponível) */}
      {(data.accountName || data.broker) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {data.accountName && <span>Conta: {data.accountName}</span>}
          {data.broker && <span>Broker: {data.broker}</span>}
          {data.importedCount && <span>Trades importados: {data.importedCount}</span>}
        </div>
      )}

      {/* Performance */}
      <div>
        <SectionTitle icon={TrendingUp} title="Performance" />
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatItem label="Lucro Líquido" value={fmtMoney(data.totalNetProfit, h)} variant={netVariant} />
          <StatItem label="Lucro Bruto" value={fmtMoney(data.grossProfit, h)} variant="profit" />
          <StatItem label="Perda Bruta" value={fmtMoney(data.grossLoss, h)} variant="loss" />
          <StatItem label="Profit Factor" value={fmt(data.profitFactor)} />
          <StatItem label="Expected Payoff" value={fmtMoney(data.expectedPayoff, h)} />
          <StatItem label="Recovery Factor" value={fmt(data.recoveryFactor)} />
          <StatItem label="Sharpe Ratio" value={fmt(data.sharpeRatio)} />
        </div>
      </div>

      {/* Drawdown */}
      <div>
        <SectionTitle icon={AlertTriangle} title="Drawdown" />
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatItem label="DD Absoluto" value={fmtMoney(data.drawdownAbsolute, h)} />
          <StatItem
            label="DD Máximo"
            value={fmtMoney(data.drawdownMaximal, h)}
            sub={data.drawdownMaximalPct != null ? `${fmt(data.drawdownMaximalPct)}%` : undefined}
            variant="loss"
          />
          <StatItem
            label="DD Relativo"
            value={fmtPct(data.drawdownRelativePct)}
            sub={data.drawdownRelative != null ? fmtMoney(data.drawdownRelative, h) : undefined}
            variant="loss"
          />
        </div>
      </div>

      {/* Distribuição de Trades */}
      <div>
        <SectionTitle icon={BarChart3} title="Distribuição" />
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatItem label="Total de Trades" value={String(data.totalTrades ?? "—")} />
          <StatItem
            label="Short (Win%)"
            value={String(data.shortTrades ?? "—")}
            sub={data.shortTradesWonPct != null ? `${fmt(data.shortTradesWonPct)}% ganhos` : undefined}
          />
          <StatItem
            label="Long (Win%)"
            value={String(data.longTrades ?? "—")}
            sub={data.longTradesWonPct != null ? `${fmt(data.longTradesWonPct)}% ganhos` : undefined}
          />
          <StatItem
            label="Lucrativos"
            value={String(data.profitTrades ?? "—")}
            sub={data.profitTradesPct != null ? `${fmt(data.profitTradesPct)}%` : undefined}
            variant="profit"
          />
          <StatItem
            label="Deficitários"
            value={String(data.lossTrades ?? "—")}
            sub={data.lossTradesPct != null ? `${fmt(data.lossTradesPct)}%` : undefined}
            variant="loss"
          />
        </div>

        {/* Barra visual de win/loss */}
        {data.profitTradesPct != null && data.lossTradesPct != null && (
          <div className="mt-3">
            <div className="flex h-3 w-full overflow-hidden rounded-full">
              <div
                className="bg-profit transition-all"
                style={{ width: `${data.profitTradesPct}%` }}
              />
              <div
                className="bg-loss transition-all"
                style={{ width: `${data.lossTradesPct}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{fmt(data.profitTradesPct)}% Win</span>
              <span>{fmt(data.lossTradesPct)}% Loss</span>
            </div>
          </div>
        )}
      </div>

      {/* Extremos */}
      <div>
        <SectionTitle icon={Target} title="Extremos" />
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatItem label="Maior Lucro" value={fmtMoney(data.largestProfit, h)} variant="profit" />
          <StatItem label="Maior Perda" value={fmtMoney(data.largestLoss, h)} variant="loss" />
          <StatItem label="Média Lucro" value={fmtMoney(data.avgProfit, h)} variant="profit" />
          <StatItem label="Média Perda" value={fmtMoney(data.avgLoss, h)} variant="loss" />
        </div>
      </div>

      {/* Consecutivos */}
      <div>
        <SectionTitle icon={Activity} title="Trades Consecutivos" />
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex items-start gap-2">
            <Trophy className="mt-0.5 h-4 w-4 text-profit" />
            <StatItem
              label="Wins Seguidos"
              value={String(data.maxConsWins ?? "—")}
              sub={data.maxConsWinsMoney != null ? (h ? HIDDEN : `$${fmt(data.maxConsWinsMoney)}`) : undefined}
              variant="profit"
            />
          </div>
          <div className="flex items-start gap-2">
            <XCircle className="mt-0.5 h-4 w-4 text-loss" />
            <StatItem
              label="Losses Seguidos"
              value={String(data.maxConsLosses ?? "—")}
              sub={data.maxConsLossesMoney != null ? (h ? HIDDEN : `$${fmt(data.maxConsLossesMoney)}`) : undefined}
              variant="loss"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
