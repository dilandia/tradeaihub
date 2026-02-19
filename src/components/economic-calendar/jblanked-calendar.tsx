"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Loader2, Calendar, AlertCircle, RefreshCw, Search, Clock } from "lucide-react";
import type { CalendarEvent } from "@/app/api/jblanked-calendar/route";

const CURRENCIES = ["", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"];

const TIMEZONES = [
  { value: "UTC", labelKey: "tzUTC" },
  { value: "America/New_York", labelKey: "tzEST" },
  { value: "America/Sao_Paulo", labelKey: "tzBRT" },
  { value: "Europe/London", labelKey: "tzLondon" },
  { value: "Europe/Berlin", labelKey: "tzBerlin" },
  { value: "Asia/Tokyo", labelKey: "tzTokyo" },
];

const STORAGE_TZ_KEY = "takez-economic-calendar-timezone";

const IMPACTS = [
  { value: "", labelKey: "allImpacts" },
  { value: "High", labelKey: "highImpact" },
  { value: "Medium", labelKey: "mediumImpact" },
  { value: "Low", labelKey: "lowImpact" },
  { value: "None", labelKey: "noneImpact" },
];

/** JBlanked API retorna horários em GMT+2 (conforme documentação). */
const API_TZ_OFFSET = "+02:00";

/** Verifica se o evento já passou (API retorna GMT+2). */
function isEventInPast(ev: CalendarEvent): boolean {
  if (!ev.date) return false;
  const normalized = ev.date.replace(/\./g, "-");
  const timeStr = ev.time ?? "23:59:59";
  const iso = `${normalized}T${timeStr}${API_TZ_OFFSET}`;
  const eventDate = new Date(iso);
  if (isNaN(eventDate.getTime())) return false;
  return eventDate.getTime() < Date.now();
}

/** Formata data/hora da API para o timezone selecionado. */
function formatEventTime(
  dateStr: string,
  timeStr: string | undefined,
  timezone: string,
  locale: string
): { dateLabel: string; timeLabel: string } {
  if (!dateStr) return { dateLabel: "—", timeLabel: "—" };
  const normalized = dateStr.replace(/\./g, "-");
  const iso = timeStr
    ? `${normalized}T${timeStr}${API_TZ_OFFSET}`
    : `${normalized}T12:00:00${API_TZ_OFFSET}`;
  let d: Date;
  try {
    d = new Date(iso);
  } catch {
    return { dateLabel: normalized, timeLabel: timeStr ?? "—" };
  }
  if (isNaN(d.getTime())) return { dateLabel: normalized, timeLabel: timeStr ?? "—" };

  const dateFmt = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const dateLabel = dateFmt.format(d);
  const timeLabel = timeStr ? timeFmt.format(d) : "—";
  return { dateLabel, timeLabel };
}

function ImpactFlags({ impact }: { impact?: "high" | "medium" | "low" | "none" }) {
  const count =
    impact === "high" ? 3 : impact === "medium" ? 2 : impact === "low" ? 1 : 0;
  const isHigh = impact === "high";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <span
          key={i}
          className={`inline-block h-2 w-1 rounded-sm ${
            i < count ? (isHigh ? "bg-red-500" : "bg-amber-500") : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

function ValueCell({
  value,
  forecast,
  previous,
}: {
  value?: number;
  forecast?: number;
  previous?: number;
}) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const str = String(value);
  let className = "text-foreground";
  if (forecast != null && previous != null) {
    if (value > forecast && value > previous) className = "text-emerald-600 dark:text-emerald-400";
    else if (value < forecast && value < previous) className = "text-red-600 dark:text-red-400";
  }
  return <span className={className}>{str}</span>;
}

export function JBlankedCalendar() {
  const { t, locale } = useLanguage();
  const [period, setPeriod] = useState<"today" | "week" | "range">("week");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [currency, setCurrency] = useState("");
  const [impact, setImpact] = useState("High");
  const [timezone, setTimezone] = useState(() => {
    if (typeof window === "undefined") return "America/Sao_Paulo";
    const stored = localStorage.getItem(STORAGE_TZ_KEY);
    if (stored) return stored;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return TIMEZONES.some((z) => z.value === tz) ? tz : "America/Sao_Paulo";
    } catch {
      return "America/Sao_Paulo";
    }
  });
  const [search, setSearch] = useState("");
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_TZ_KEY, timezone);
    }
  }, [timezone]);

  const fetchEvents = useCallback(
    async (forceRefresh = false) => {
      if (period === "range" && (!from || !to)) {
        setAllEvents([]);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("period", period);
        if (period === "range" && from && to) {
          params.set("from", from);
          params.set("to", to);
        }
        if (forceRefresh) params.set("refresh", "1");

        const res = await fetch(`/api/jblanked-calendar?${params.toString()}`);
        const text = await res.text();
        let json: unknown;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          if (!res.ok) {
            throw new Error(text || `Erro ${res.status}`);
          }
          throw new Error(t("economicEvents.loadError"));
        }

        if (!res.ok) {
          const msg = (json as { error?: string })?.error ?? t("economicEvents.loadError");
          throw new Error(msg);
        }

        const data = json as CalendarEvent[];
        setAllEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("economicEvents.loadError"));
        setAllEvents([]);
      } finally {
        setLoading(false);
      }
    },
    [period, from, to, t]
  );

  useEffect(() => {
    fetchEvents(false);
  }, [fetchEvents]);

  const events = useMemo(() => {
    let list = allEvents;
    if (currency) {
      list = list.filter((e) => e.currency?.toUpperCase() === currency.toUpperCase());
    }
    if (impact) {
      const impactLower = impact.toLowerCase();
      list = list.filter((e) => e.impact === impactLower);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.currency?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allEvents, currency, impact, search]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const key = ev.date ?? "";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  const today = new Date().toISOString().slice(0, 10);

  const [currentTime, setCurrentTime] = useState("");
  const [tzOffset, setTzOffset] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const timeFmt = new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const parts = new Intl.DateTimeFormat("en", {
        timeZone: timezone,
        timeZoneName: "shortOffset",
      }).formatToParts(now);
      const tzPart = parts.find((p) => p.type === "timeZoneName");
      setCurrentTime(timeFmt.format(now));
      setTzOffset(tzPart?.value ?? "");
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [timezone, locale]);

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Barra de filtros - estilo referência */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("economicEvents.thisWeek")}
          </label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPeriod("today")}
              className={`rounded border px-3 py-1.5 text-sm transition-colors ${
                period === "today"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {t("economicEvents.today")}
            </button>
            <button
              type="button"
              onClick={() => setPeriod("week")}
              className={`rounded border px-3 py-1.5 text-sm transition-colors ${
                period === "week"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {t("economicEvents.thisWeek")}
            </button>
            <button
              type="button"
              onClick={() => setPeriod("range")}
              className={`rounded border px-3 py-1.5 text-sm transition-colors ${
                period === "range"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {t("economicEvents.dateRange")}
            </button>
          </div>
        </div>

        {period === "range" && (
          <div className="flex items-end gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                {t("economicEvents.from")}
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                max={to || today}
                className="rounded border border-input bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                {t("economicEvents.to")}
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                min={from}
                max={today}
                className="rounded border border-input bg-background px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("economicEvents.currency")}
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="rounded border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="">—</option>
            {CURRENCIES.filter(Boolean).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("economicEvents.impact")}
          </label>
          <select
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
            className="rounded border border-input bg-background px-3 py-1.5 text-sm"
          >
            {IMPACTS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {t(`economicEvents.${opt.labelKey}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 min-w-[180px] flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("economicEvents.searchPlaceholder")}
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("economicEvents.searchPlaceholder")}
              className="w-full rounded border border-input bg-background py-1.5 pl-8 pr-3 text-sm"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchEvents(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          title={t("economicEvents.refresh")}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {t("economicEvents.refresh")}
        </button>
      </div>

      {/* Horário atual + seletor de fuso (como na referência) */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            {t("economicEvents.currentTime")}:
          </span>
          <span className="font-semibold tabular-nums">{currentTime || "—"}</span>
          {tzOffset && (
            <span className="text-sm text-muted-foreground">({tzOffset})</span>
          )}
        </div>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="rounded border border-input bg-background px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-muted/50 transition-colors"
          aria-label={t("economicEvents.timezone")}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {t(`economicEvents.${tz.labelKey}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela de eventos */}
      <div className="min-h-[400px] overflow-hidden rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-[400px] flex-col items-center justify-center gap-3 text-muted-foreground">
            <AlertCircle className="h-10 w-10" />
            <p className="text-center px-4">{error}</p>
            <button
              type="button"
              onClick={() => fetchEvents(true)}
              className="inline-flex items-center gap-2 rounded border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              {t("economicEvents.retry")}
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="flex h-[400px] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Calendar className="h-10 w-10" />
            <p>
              {period === "range" && (!from || !to)
                ? t("economicEvents.selectDateRange")
                : t("economicEvents.noEvents")}
            </p>
            <button
              type="button"
              onClick={() => fetchEvents(true)}
              className="inline-flex items-center gap-2 rounded border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              {t("economicEvents.retry")}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("economicEvents.date")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("economicEvents.time")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("economicEvents.currency")}
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground w-12">
                    {t("economicEvents.impact")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("economicEvents.event")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {t("economicEvents.actual")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {t("economicEvents.forecast")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {t("economicEvents.previous")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupedByDate.map(([dateKey, dayEvents]) =>
                  dayEvents.map((ev, i) => {
                    const { dateLabel, timeLabel } = formatEventTime(
                      ev.date,
                      ev.time,
                      timezone,
                      locale
                    );
                    const isAllDay = !ev.time;
                    const isPast = isEventInPast(ev);
                    return (
                      <tr
                        key={`${ev.date}-${ev.time}-${ev.name}-${i}`}
                        className={`border-b border-border/50 transition-colors ${
                          i % 2 === 0 ? "bg-background" : "bg-muted/20"
                        } ${
                          isPast ? "opacity-60 [&_td]:text-muted-foreground" : ""
                        }`}
                      >
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {i === 0 ? dateLabel : ""}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">
                          {isAllDay ? t("economicEvents.allDay") : timeLabel}
                        </td>
                        <td className="px-4 py-2.5 font-medium">
                          {ev.currency ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <ImpactFlags impact={ev.impact} />
                        </td>
                        <td className="px-4 py-2.5">
                          <div>
                            <span className="font-medium text-foreground">{ev.name}</span>
                            {ev.category && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({ev.category})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          <ValueCell
                            value={ev.actual}
                            forecast={ev.forecast}
                            previous={ev.previous}
                          />
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                          {ev.forecast != null ? String(ev.forecast) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                          {ev.previous != null ? String(ev.previous) : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
