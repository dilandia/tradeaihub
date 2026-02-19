"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import {
  createChart,
  CandlestickSeries,
  createSeriesMarkers,
  ColorType,
} from "lightweight-charts";
import type { DbTrade } from "@/lib/trades";
import type { UTCTimestamp } from "lightweight-charts";

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */

interface TradeChartLightweightProps {
  trade: DbTrade;
  className?: string;
  /** Quando trade vem de conta MetaApi – usa dados do broker. */
  metaapiAccountId?: string;
  /** Chamado quando as barras OHLC estão prontas (real ou sintético) para Running P&L */
  onBarsLoaded?: (bars: BarData[], entryTs: number, exitTs: number) => void;
}

type BarData = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
};

type ChartState = {
  bars: BarData[];
  entryTs: number;
  exitTs: number;
  markerEntryTime: UTCTimestamp;
  markerExitTime: UTCTimestamp;
  ohlc: { o: number; h: number; l: number; c: number; pctChange: number };
};

/* ═══════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════ */

function formatPrice(p: number): string {
  return p.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5,
  });
}

/** Calcula UTC timestamp em segundos a partir de date + time strings. */
function toUtcTs(dateStr: string, timeStr: string | null): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  let hour = 0, minute = 0, second = 0;
  if (timeStr) {
    const parts = timeStr.split(":");
    hour = parseInt(parts[0] ?? "0", 10);
    minute = parseInt(parts[1] ?? "0", 10);
    second = parseInt(parts[2] ?? "0", 10);
  }
  return Math.floor(Date.UTC(y, m - 1, d, hour, minute, second) / 1000);
}

/** Formata YYYY-MM-DD a partir de um Date. */
function formatDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Calcula timestamps de entrada e saída do trade.
 * Lida com trades overnight (entry_time > exit_time → exit no dia seguinte).
 */
function getTradeTimestamps(trade: DbTrade): { entryTs: number; exitTs: number; startDate: string; endDate: string } {
  const entryTs = toUtcTs(trade.trade_date, trade.entry_time);

  let exitTs: number;
  let endDateStr: string;

  if (trade.exit_time && trade.entry_time) {
    const entryMinutes = parseTimeMinutes(trade.entry_time);
    const exitMinutes = parseTimeMinutes(trade.exit_time);

    if (exitMinutes < entryMinutes) {
      // Trade overnight: exit é no dia seguinte
      const nextDay = new Date(trade.trade_date);
      nextDay.setDate(nextDay.getDate() + 1);
      endDateStr = formatDateStr(nextDay);
      exitTs = toUtcTs(endDateStr, trade.exit_time);
    } else {
      endDateStr = trade.trade_date;
      exitTs = toUtcTs(trade.trade_date, trade.exit_time);
    }
  } else {
    endDateStr = trade.trade_date;
    exitTs = toUtcTs(trade.trade_date, trade.exit_time ?? "23:59:00");
  }

  // Contexto: 6 horas antes da entrada e 6 horas depois da saída
  const PAD_HOURS = 6;
  const padSec = PAD_HOURS * 3600;
  const fetchStart = new Date((entryTs - padSec) * 1000);
  const fetchEnd = new Date((exitTs + padSec) * 1000);

  return {
    entryTs,
    exitTs,
    startDate: formatDateStr(fetchStart),
    endDate: formatDateStr(fetchEnd),
  };
}

function parseTimeMinutes(t: string): number {
  const parts = t.split(":");
  return parseInt(parts[0] ?? "0", 10) * 60 + parseInt(parts[1] ?? "0", 10);
}

/** Encontra o candle mais próximo de um timestamp alvo. */
function findNearestBar(bars: BarData[], targetTs: number): UTCTimestamp {
  if (bars.length === 0) return targetTs as UTCTimestamp;
  let best = bars[0].time;
  let bestDiff = Math.abs(bars[0].time - targetTs);
  for (const b of bars) {
    const diff = Math.abs(b.time - targetTs);
    if (diff < bestDiff) {
      best = b.time;
      bestDiff = diff;
    }
  }
  return best;
}

/** Calcula OHLC do período visível. */
function calcOhlc(bars: BarData[]): { o: number; h: number; l: number; c: number; pctChange: number } {
  if (bars.length === 0) return { o: 0, h: 0, l: 0, c: 0, pctChange: 0 };
  const o = bars[0].open;
  const h = Math.max(...bars.map((b) => b.high));
  const l = Math.min(...bars.map((b) => b.low));
  const c = bars[bars.length - 1].close;
  const pctChange = o ? ((c - o) / o) * 100 : 0;
  return { o, h, l, c, pctChange };
}

/** Calcula o intervalo ideal baseado na duração do trade. */
function calcInterval(entryTs: number, exitTs: number): string {
  const durationMin = (exitTs - entryTs) / 60;
  if (durationMin <= 30) return "1min";
  if (durationMin <= 120) return "5min";
  if (durationMin <= 480) return "15min";
  if (durationMin <= 1440) return "30min";
  return "1h";
}

/** Prefixo e TTL do cache client-side (24h). */
const OHLC_CACHE_PREFIX = "takez_ohlc_";
const OHLC_CACHE_TTL_MS = 86400 * 1000; // 24 horas

function getOhlcCacheKey(symbol: string, startDate: string, endDate: string, interval: string): string {
  return `${OHLC_CACHE_PREFIX}${symbol}_${startDate}_${endDate}_${interval}`;
}

function getCachedOhlc(key: string): BarData[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { bars, ts } = JSON.parse(raw) as { bars: BarData[]; ts: number };
    if (!Array.isArray(bars) || bars.length === 0) return null;
    if (Date.now() - ts > OHLC_CACHE_TTL_MS) return null;
    return bars;
  } catch {
    return null;
  }
}

function setCachedOhlc(key: string, bars: BarData[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify({ bars, ts: Date.now() }));
  } catch {
    // localStorage cheio ou indisponível – ignora
  }
}

/* ═══════════════════════════════════════════
   Component
   ═══════════════════════════════════════════ */

export function TradeChartLightweight({
  trade,
  metaapiAccountId,
  className = "",
  onBarsLoaded,
}: TradeChartLightweightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [useRealData, setUseRealData] = useState(false);
  const [chartData, setChartData] = useState<ChartState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ── Fetch data (com cache client-side em localStorage) ── */
  useEffect(() => {
    let cancelled = false;
    const { entryTs, exitTs, startDate, endDate } = getTradeTimestamps(trade);
    const interval = calcInterval(entryTs, exitTs);

    const symbol = trade.pair.replace("/", "").replace("_", "").replace("-", "");
    const cacheKey = getOhlcCacheKey(symbol, startDate, endDate, interval);

    setLoading(true);
    setErrorMsg(null);

    const applyBars = (bars: BarData[]) => {
      if (cancelled) return;
      const markerEntryTime = findNearestBar(bars, entryTs);
      const markerExitTime = findNearestBar(bars, exitTs);
      const ohlc = calcOhlc(bars);
      setChartData({
        bars,
        entryTs,
        exitTs,
        markerEntryTime,
        markerExitTime,
        ohlc,
      });
      setUseRealData(true);
      setLoading(false);
      onBarsLoaded?.(bars, entryTs, exitTs);
    };

    const cached = getCachedOhlc(cacheKey);
    if (cached) {
      applyBars(cached);
      return;
    }

    const params = new URLSearchParams({
      symbol,
      startDate,
      endDate,
      interval,
    });
    if (metaapiAccountId) {
      params.set("metaapiAccountId", metaapiAccountId);
      params.set("region", "new-york");
    }
    const url = `/api/ohlc?${params.toString()}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d?.error ?? `HTTP ${res.status}`); });
        return res.json();
      })
      .then((data: { bars: BarData[] }) => {
        if (cancelled) return;
        const bars = (data.bars ?? []) as BarData[];
        if (bars.length === 0) throw new Error("Nenhuma barra retornada");
        setCachedOhlc(cacheKey, bars);
        applyBars(bars);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("[chart] Fallback to synthetic:", err.message);
        setErrorMsg(err.message);
        setUseRealData(false);
        const synth = buildMinimalSynthetic(entryTs, exitTs, Number(trade.entry_price), Number(trade.exit_price));
        const markerEntryTime = synth.bars[0]?.time ?? (entryTs as UTCTimestamp);
        const markerExitTime = synth.bars[synth.bars.length - 1]?.time ?? (exitTs as UTCTimestamp);
        setChartData({
          bars: synth.bars,
          entryTs,
          exitTs,
          markerEntryTime,
          markerExitTime,
          ohlc: calcOhlc(synth.bars),
        });
        onBarsLoaded?.(synth.bars, entryTs, exitTs);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [trade]);

  /* ── Render chart ── */
  useEffect(() => {
    if (!containerRef.current || loading) return;
    if (!chartData && !errorMsg) return;

    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark");

    const { entryTs, exitTs } = getTradeTimestamps(trade);
    const entryPrice = Number(trade.entry_price);
    const exitPrice = Number(trade.exit_price);

    let bars: BarData[];
    let markerEntryTime: UTCTimestamp;
    let markerExitTime: UTCTimestamp;

    if (chartData && useRealData) {
      bars = chartData.bars;
      markerEntryTime = chartData.markerEntryTime;
      markerExitTime = chartData.markerExitTime;
    } else {
      // Fallback: gera barras sintéticas mínimas
      const synth = buildMinimalSynthetic(entryTs, exitTs, entryPrice, exitPrice);
      bars = synth.bars;
      markerEntryTime = bars[0].time;
      markerExitTime = bars[bars.length - 1].time;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#1a1a1a" : "#ffffff" },
        textColor: isDark ? "#d1d5db" : "#374151",
      },
      grid: {
        vertLines: { color: isDark ? "#2d2d2d" : "#e5e7eb" },
        horzLines: { color: isDark ? "#2d2d2d" : "#e5e7eb" },
      },
      rightPriceScale: {
        borderColor: isDark ? "#2d2d2d" : "#e5e7eb",
        borderVisible: false,
      },
      timeScale: {
        borderColor: isDark ? "#2d2d2d" : "#e5e7eb",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: { mode: 1 },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: true,
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    candleSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.1, bottom: 0.1 },
    });
    candleSeries.setData(bars);

    // Marcadores de entrada e saída
    const markers = [
      { time: markerEntryTime, position: "belowBar" as const, color: "#22c55e", shape: "arrowUp" as const, text: t("trades.entry") },
      { time: markerExitTime, position: "aboveBar" as const, color: "#ef4444", shape: "arrowDown" as const, text: t("trades.exit") },
    ].sort((a, b) => (a.time as number) - (b.time as number));

    createSeriesMarkers(candleSeries, markers);

    // Linhas de preço
    candleSeries.createPriceLine({
      price: entryPrice,
      color: "#22c55e",
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: t("trades.entry"),
    });
    candleSeries.createPriceLine({
      price: exitPrice,
      color: "#ef4444",
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: t("trades.exit"),
    });

    // Mostra o gráfico completo (como TradingView/Tradezella) – usuário pode zoom/scroll
    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [chartData, loading, errorMsg, trade, t, useRealData]);

  /* ── OHLC display ── */
  const displayOhlc = chartData?.ohlc ?? { o: 0, h: 0, l: 0, c: 0, pctChange: 0 };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className={className}>
        <div className="mb-2 h-4 animate-pulse rounded bg-muted" />
        <div
          className="flex w-full items-center justify-center rounded-md border border-border bg-muted/30"
          style={{ aspectRatio: "16/9", minHeight: 280 }}
        >
          <span className="text-sm text-muted-foreground">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* OHLC header */}
      <div className="mb-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-foreground">
        <span className="font-semibold">{trade.pair}</span>
        {useRealData && (
          <>
            <span>
              O {formatPrice(displayOhlc.o)} H {formatPrice(displayOhlc.h)} L{" "}
              {formatPrice(displayOhlc.l)} C {formatPrice(displayOhlc.c)}
            </span>
            <span className={displayOhlc.pctChange >= 0 ? "text-profit" : "text-loss"}>
              {displayOhlc.pctChange >= 0 ? "+" : ""}
              {displayOhlc.pctChange.toFixed(2)}%
            </span>
            <span className="rounded bg-profit/20 px-1.5 py-0.5 text-[10px] font-medium text-profit">
              {t("trades.realData")}
            </span>
          </>
        )}
        {!useRealData && errorMsg && (
          <span className="rounded bg-loss/20 px-1.5 py-0.5 text-[10px] font-medium text-loss">
            Synthetic
          </span>
        )}
      </div>

      {/* Chart container */}
      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-md border border-border"
        style={{ aspectRatio: "16/9", minHeight: 280 }}
      />

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#22c55e" }} />
            {t("trades.entry")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#ef4444" }} />
            {t("trades.exit")}
          </span>
        </div>
        <a
          href={`https://www.tradingview.com/chart/?symbol=OANDA:${trade.pair.replace("/", "").toUpperCase()}&interval=5`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground/70 hover:text-muted-foreground"
        >
          {t("trades.viewRealDataTradingView")}
        </a>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Synthetic fallback
   ═══════════════════════════════════════════ */

function buildMinimalSynthetic(
  entryTs: number,
  exitTs: number,
  entryPrice: number,
  exitPrice: number
): { bars: BarData[] } {
  const bars: BarData[] = [];

  const actualExit = exitTs <= entryTs ? entryTs + 300 : exitTs;
  const totalSeconds = actualExit - entryTs;
  const steps = Math.max(8, Math.min(50, Math.floor(totalSeconds / 60)));
  const stepSec = Math.max(60, Math.floor(totalSeconds / steps));
  const priceRange = Math.abs(exitPrice - entryPrice) || 1;
  const wiggle = priceRange * 0.015;

  let prevClose = entryPrice;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const targetPrice = entryPrice + (exitPrice - entryPrice) * t;
    const noise = (Math.random() - 0.5) * wiggle * 2;
    const close = targetPrice + noise;
    const time = (entryTs + i * stepSec) as UTCTimestamp;

    if (bars.length > 0 && time <= bars[bars.length - 1].time) continue;

    const open = prevClose;
    const high = Math.max(open, close) + Math.random() * wiggle;
    const low = Math.min(open, close) - Math.random() * wiggle;

    bars.push({ time, open, high, low, close });
    prevClose = close;
  }

  return { bars };
}
