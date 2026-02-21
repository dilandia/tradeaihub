/**
 * Date utility helpers for converting period strings to date ranges.
 * Used by AI routes to push date filtering to the database via getTradesByDateRange().
 *
 * W3-01: Extracted from filterByDateRange() logic in dashboard-calc.ts.
 */

export type DateRange = {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
};

/**
 * Converts a period string (e.g. "7d", "30d", "ytd") into a { startDate, endDate } range.
 * Returns null for "all" (meaning no date filter should be applied).
 *
 * Mirrors the logic in filterByDateRange() from dashboard-calc.ts to ensure consistency.
 *
 * @param period - One of: "all", "7d", "14d", "30d", "90d", "6m", "1y", "ytd"
 * @returns DateRange or null if period is "all"
 */
export function periodToDateRange(period: string): DateRange | null {
  if (period === "all") return null;

  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);

  let cutoff: Date;

  if (period === "ytd") {
    cutoff = new Date(now.getFullYear(), 0, 1);
  } else {
    const map: Record<string, number> = {
      "7d": 7,
      "14d": 14,
      "30d": 30,
      "90d": 90,
      "6m": 180,
      "1y": 365,
    };
    const days = map[period] ?? 30;
    cutoff = new Date(now.getTime() - days * 86400000);
  }

  const startDate = cutoff.toISOString().slice(0, 10);
  return { startDate, endDate };
}
