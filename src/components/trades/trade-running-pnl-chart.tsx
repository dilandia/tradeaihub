"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
type BarData = { time: number; open: number; high: number; low: number; close: number };

interface TradeRunningPnlChartProps {
  bars: BarData[];
  entryTs: number;
  exitTs: number;
  entryPrice: number;
  exitPrice: number;
  profitDollar: number;
  isLong: boolean;
  hasDollar: boolean;
}

/**
 * Constrói a curva de P&L ao longo do trade (desenrolar).
 * Para cada candle entre entrada e saída: P&L = f(preço_close, entry, exit, profit_total).
 */
function buildRunningPnlFromBars(
  bars: BarData[],
  entryTs: number,
  exitTs: number,
  entryPrice: number,
  exitPrice: number,
  profitDollar: number,
  isLong: boolean
): { time: string; pnl: number; pnlPos: number; pnlNeg: number }[] {
  const priceRange = Math.abs(exitPrice - entryPrice) || 0.0001;
  const data: { time: string; pnl: number; ts: number }[] = [];

  const fmt = (ts: number) => {
    const d = new Date(ts * 1000);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  // Ponto inicial: entrada
  data.push({ time: fmt(entryTs), pnl: 0, ts: entryTs });

  // Barras entre entrada e saída
  for (const bar of bars) {
    if (bar.time < entryTs || bar.time > exitTs) continue;

    let pnl: number;
    if (isLong) {
      pnl = ((bar.close - entryPrice) / priceRange) * profitDollar;
    } else {
      pnl = ((entryPrice - bar.close) / priceRange) * profitDollar;
    }

    data.push({ time: fmt(bar.time), pnl, ts: bar.time });
  }

  // Ordena por tempo
  data.sort((a, b) => a.ts - b.ts);

  // Garante ponto final com P&L final
  const last = data[data.length - 1];
  if (data.length > 1 && last && Math.abs(last.pnl - profitDollar) > 0.01) {
    data.push({ time: fmt(exitTs), pnl: profitDollar, ts: exitTs });
    data.sort((a, b) => a.ts - b.ts);
  }

  // Insere pontos de cruzamento com zero para transição suave verde/vermelho
  const withCrossings: { time: string; pnl: number; ts: number }[] = [];
  for (let i = 0; i < data.length; i++) {
    const curr = data[i]!;
    const prev = data[i - 1];
    if (prev && ((prev.pnl > 0 && curr.pnl < 0) || (prev.pnl < 0 && curr.pnl > 0))) {
      const t = prev.ts + (curr.ts - prev.ts) * Math.abs(prev.pnl) / (Math.abs(prev.pnl) + Math.abs(curr.pnl));
      withCrossings.push({ time: fmt(t), pnl: 0, ts: t });
    }
    withCrossings.push(curr);
  }
  const final = withCrossings.length > 0 ? withCrossings : data;
  const toReturn = final.length > 1 ? final : [
    { time: fmt(entryTs), pnl: 0, ts: entryTs },
    { time: fmt(exitTs), pnl: profitDollar, ts: exitTs },
  ];

  return toReturn.map(({ time, pnl }) => ({
    time,
    pnl,
    pnlPos: pnl >= 0 ? pnl : 0,
    pnlNeg: pnl < 0 ? pnl : 0,
  }));
}

export function TradeRunningPnlChart({
  bars,
  entryTs,
  exitTs,
  entryPrice,
  exitPrice,
  profitDollar,
  isLong,
  hasDollar,
}: TradeRunningPnlChartProps) {
  const pnlData = buildRunningPnlFromBars(bars, entryTs, exitTs, entryPrice, exitPrice, profitDollar, isLong);

  const minPnl = Math.min(0, ...pnlData.map((d) => d.pnl));
  const maxPnl = Math.max(0, ...pnlData.map((d) => d.pnl));
  const padding = Math.max(10, (maxPnl - minPnl) * 0.1) || 10;

  const GREEN = "rgb(34, 197, 94)";
  const RED = "rgb(239, 68, 68)";

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={pnlData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pnlGradGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GREEN} stopOpacity={0.4} />
              <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="pnlGradRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={RED} stopOpacity={0} />
              <stop offset="100%" stopColor={RED} stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => (hasDollar ? `$${v}` : `${v}`)}
            domain={[minPnl - padding, maxPnl + padding]}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0]?.payload as { time: string; pnl: number };
              if (!p) return null;
              return (
                <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md">
                  <p className="text-muted-foreground">{p.time}</p>
                  <p className={p.pnl >= 0 ? "font-medium text-profit" : "font-medium text-loss"}>
                    P&L: {hasDollar ? `$${p.pnl.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : p.pnl.toFixed(1)}
                  </p>
                </div>
              );
            }}
          />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="pnlPos"
            stroke={GREEN}
            fill="url(#pnlGradGreen)"
            strokeWidth={2}
            baseValue={0}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="pnlNeg"
            stroke={RED}
            fill="url(#pnlGradRed)"
            strokeWidth={2}
            baseValue={0}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
