/**
 * Parsers para importação de trades (CSV, Excel Doo/MT, HTML MT5).
 * Também extrai métricas do bloco "Results" e info da conta.
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";

/* ─────────────────── Tipos ─────────────────── */

export type TradeInsert = {
  trade_date: string;
  pair: string;
  entry_price: number;
  exit_price: number;
  pips: number;
  is_win: boolean;
  risk_reward?: number;
  tags?: string[];
  notes?: string;
  entry_time?: string | null;
  exit_time?: string | null;
  duration_minutes?: number | null;
  profit_dollar?: number | null;
};

export type AccountInfo = {
  account_name: string | null;
  account_number: string | null;
  broker: string | null;
  report_date: string | null;
};

export type ImportSummary = AccountInfo & {
  total_net_profit: number | null;
  gross_profit: number | null;
  gross_loss: number | null;
  profit_factor: number | null;
  expected_payoff: number | null;
  recovery_factor: number | null;
  sharpe_ratio: number | null;
  balance_drawdown_absolute: number | null;
  balance_drawdown_maximal: number | null;
  balance_drawdown_maximal_pct: number | null;
  balance_drawdown_relative_pct: number | null;
  balance_drawdown_relative: number | null;
  total_trades: number | null;
  short_trades: number | null;
  short_trades_won_pct: number | null;
  long_trades: number | null;
  long_trades_won_pct: number | null;
  profit_trades: number | null;
  profit_trades_pct: number | null;
  loss_trades: number | null;
  loss_trades_pct: number | null;
  largest_profit_trade: number | null;
  largest_loss_trade: number | null;
  average_profit_trade: number | null;
  average_loss_trade: number | null;
  max_consecutive_wins: number | null;
  max_consecutive_wins_money: number | null;
  max_consecutive_losses: number | null;
  max_consecutive_losses_money: number | null;
  max_consecutive_profit: number | null;
  max_consecutive_profit_count: number | null;
  max_consecutive_loss: number | null;
  max_consecutive_loss_count: number | null;
};

export type ParseResult = {
  trades: TradeInsert[];
  summary: ImportSummary | null;
  htmlJsonOnly?: boolean;
};

/* ─────────────────── Helpers ─────────────────── */

export function parseNumber(val: unknown): number {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string") {
    // Remove espaços (separador de milhar) e troca vírgula por ponto
    const n = parseFloat(val.replace(/\s/g, "").replace(",", ".").trim());
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function parseBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    const s = val.toLowerCase().trim();
    return s === "true" || s === "1" || s === "win" || s === "w" || s === "sim" || s === "yes";
  }
  return false;
}

function parseTags(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((v) => typeof v === "string");
  if (typeof val === "string")
    return val.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

/** Extrai "count (pct%)" → { count, pct }. Ex: "59 (59.32%)" */
function parseCountPct(val: unknown): { count: number; pct: number } {
  const s = String(val ?? "");
  const m = s.match(/^([\d\s.,]+)\s*\(([\d.,]+)%?\)/);
  if (m) return { count: parseNumber(m[1]), pct: parseNumber(m[2]) };
  return { count: 0, pct: 0 };
}

/** Extrai "value (pct%)" → { value, pct }. Ex: "6 954.71 (6.01%)" */
function parseValuePct(val: unknown): { value: number; pct: number } {
  const s = String(val ?? "");
  const m = s.match(/^([\d\s.,+-]+)\s*\(([\d.,]+)%?\)/);
  if (m) return { value: parseNumber(m[1]), pct: parseNumber(m[2]) };
  return { value: 0, pct: 0 };
}

/** Extrai "pct% (value)" → { pct, value }. Ex: "6.01% (6 954.71)" */
function parsePctValue(val: unknown): { pct: number; value: number } {
  const s = String(val ?? "");
  const m = s.match(/^([\d.,]+)%?\s*\(([\d\s.,+-]+)\)/);
  if (m) return { pct: parseNumber(m[1]), value: parseNumber(m[2]) };
  return { pct: 0, value: 0 };
}

/** Extrai "count (money)" → { count, money }. Ex: "11 (13 408.38)" ou "5 (-838.56)" */
function parseCountMoney(val: unknown): { count: number; money: number } {
  const s = String(val ?? "");
  const m = s.match(/^(\d+)\s*\(([\d\s.,+-]+)\)/);
  if (m) return { count: parseInt(m[1], 10), money: parseNumber(m[2]) };
  return { count: 0, money: 0 };
}

/** Extrai "money (count)" → { money, count }. Ex: "13 408.38 (11)" ou "-6 954.71 (4)" */
function parseMoneyCount(val: unknown): { money: number; count: number } {
  const s = String(val ?? "");
  const m = s.match(/^([\d\s.,+-]+)\s*\((\d+)\)/);
  if (m) return { money: parseNumber(m[1]), count: parseInt(m[2], 10) };
  return { money: 0, count: 0 };
}

/** Extrai hora HH:MM:SS de uma string datetime como "2024.10.15 09:30:00" */
function extractTime(datetime: string): string | null {
  const parts = datetime.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const time = parts[1];
  // Valida formato HH:MM ou HH:MM:SS
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) return time;
  return null;
}

/** Calcula duração em minutos entre dois datetimes */
function calcDurationMinutes(entryDatetime: string, exitDatetime: string): number | null {
  const parse = (s: string): Date | null => {
    // Converte "2024.10.15 09:30:00" → Date
    const normalized = s.trim().replace(/\./g, "-");
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  };
  const start = parse(entryDatetime);
  const end = parse(exitDatetime);
  if (!start || !end) return null;
  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return null;
  return Math.round((diffMs / 60000) * 100) / 100; // arredonda 2 casas
}

function calcPips(pair: string, entry: number, exit: number, isWin: boolean, profit: number): number {
  if (entry !== 0 && exit !== 0) {
    const diff = Math.abs(exit - entry);
    const isGold = /xau|gold/i.test(pair);
    const isJpy = pair.includes("JPY");
    let pips = isGold ? diff * 100 : isJpy ? diff * 100 : diff * 10000;
    pips = Math.round(pips * 10) / 10;
    return isWin ? pips : -pips;
  }
  return isWin ? Math.abs(profit) : -Math.abs(profit);
}

/* ─────── Excel: Detecção e parsing Doo/MT ─────── */

function findPositionsHeaderRow(raw: unknown[][]): number {
  const max = Math.min(raw.length, 20);
  for (let i = 0; i < max; i++) {
    const row = raw[i] as unknown[];
    if (!Array.isArray(row) || row.length < 10) continue;
    const cells = row.map((c) => String(c ?? "").toLowerCase().trim());
    if (cells[0] === "time" && cells.includes("symbol") && cells.includes("profit")) {
      return i;
    }
  }
  return -1;
}

export function isDooMtFormat(raw: unknown[][]): boolean {
  if (raw.length < 5) return false;
  const first = String((raw[0] ?? [])[0] ?? "").toLowerCase();
  if (first.includes("trade") && first.includes("history")) return true;
  return findPositionsHeaderRow(raw) >= 0;
}

export function parseDooMtPositions(raw: unknown[][]): TradeInsert[] {
  const trades: TradeInsert[] = [];
  const headerIdx = findPositionsHeaderRow(raw);
  if (headerIdx < 0) return trades;

  const headerRow = (raw[headerIdx] as unknown[]).map((c) => String(c ?? "").toLowerCase().trim());
  const colSymbol = headerRow.indexOf("symbol");
  const colProfit = headerRow.indexOf("profit");
  const colType = headerRow.indexOf("type");
  const colSL = headerRow.findIndex((c) => /s\s*[\/.]\s*l|l\s*[\/.]\s*s|stop\s*loss|sl\b/i.test(c));
  const colTP = headerRow.findIndex((c) => /t\s*[\/.]\s*p|p\s*[\/.]\s*t|take\s*profit|tp\b/i.test(c));
  const fp = headerRow.indexOf("price");
  const sp = fp >= 0 ? headerRow.indexOf("price", fp + 1) : -1;
  if (colSymbol < 0 || colProfit < 0) return trades;

  // Detect second "time" column (exit time) if present
  const ft = headerRow.indexOf("time"); // first time column (entry/open)
  const st = ft >= 0 ? headerRow.indexOf("time", ft + 1) : -1; // second time column (exit/close)

  const dateRe = /^\d{4}[.\-/]/;
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i] as unknown[];
    if (!Array.isArray(row) || row.length < 5) continue;
    const firstCell = String(row[0] ?? "").trim();
    if (!dateRe.test(firstCell)) break;

    const symbolVal = row[colSymbol];
    const entry = fp >= 0 ? parseNumber(row[fp]) : 0;
    const exit = sp >= 0 ? parseNumber(row[sp]) : 0;
    const profit = parseNumber(row[colProfit]);
    if (!symbolVal) continue;
    const pair = String(symbolVal).replace(/\.c$/i, "").trim().toUpperCase();
    if (!pair) continue;

    const tradeDate = firstCell.split(" ")[0].replace(/\./g, "-");
    const is_win = profit >= 0;

    // R-múltiplo planejado a partir de S/L e T/P (quando disponíveis)
    let risk_reward: number | undefined;
    if (colSL >= 0 && colTP >= 0 && entry > 0) {
      const sl = parseNumber(row[colSL]);
      const tp = parseNumber(row[colTP]);
      const typeStr = colType >= 0 ? String(row[colType] ?? "").toLowerCase() : "";
      const isBuy = typeStr === "buy" || typeStr === "0" || (colType < 0 && (is_win ? exit > entry : exit < entry));
      if (sl > 0 && tp > 0 && sl !== entry && tp !== entry) {
        const riskDist = isBuy ? entry - sl : sl - entry;
        const rewardDist = isBuy ? tp - entry : entry - tp;
        if (riskDist > 0 && rewardDist > 0) {
          risk_reward = Math.round((rewardDist / riskDist) * 100) / 100;
        }
      }
    }

    // Extract time info
    const entryDatetime = ft >= 0 ? String(row[ft] ?? "").trim() : firstCell;
    const exitDatetime = st >= 0 ? String(row[st] ?? "").trim() : "";
    const entry_time = extractTime(entryDatetime);
    const exit_time = exitDatetime ? extractTime(exitDatetime) : null;
    const duration_minutes = exitDatetime
      ? calcDurationMinutes(entryDatetime, exitDatetime)
      : null;

    trades.push({
      trade_date: tradeDate,
      pair,
      entry_price: entry,
      exit_price: exit,
      pips: calcPips(pair, entry, exit, is_win, profit),
      is_win,
      entry_time,
      exit_time,
      duration_minutes,
      profit_dollar: profit !== 0 ? profit : null,
      risk_reward: risk_reward ?? undefined,
    });
  }
  return trades;
}

/* ─────── Excel: Account Info (linhas 0-4) ─────── */

export function parseAccountInfo(raw: unknown[][]): AccountInfo {
  const getCol3 = (rowIdx: number): string => {
    const row = raw[rowIdx];
    if (!Array.isArray(row)) return "";
    return String(row[3] ?? "").trim();
  };

  const accountRaw = getCol3(2); // "9926651 (USC, DooTechnology-Live, real, Hedge)"
  const accountMatch = accountRaw.match(/^(\d+)/);

  return {
    account_name: getCol3(1) || null,   // Name
    account_number: accountMatch?.[1] ?? null,
    broker: getCol3(3) || null,          // Company
    report_date: getCol3(4)?.replace(/\./g, "-") || null, // Date
  };
}

/* ─────── Excel: Results (bloco de métricas) ─────── */

export function parseResultsSection(raw: unknown[][]): Omit<ImportSummary, keyof AccountInfo> | null {
  // Encontra a linha "Results"
  let resultsIdx = -1;
  for (let i = raw.length - 1; i >= 0; i--) {
    if (String((raw[i] as unknown[])?.[0] ?? "").trim() === "Results") {
      resultsIdx = i;
      break;
    }
  }
  if (resultsIdx < 0) return null;

  // Helper: busca valor numa coluna específica de uma linha relativa ao Results
  const getRow = (offset: number) => (raw[resultsIdx + offset] ?? []) as unknown[];

  // Row +1: Total Net Profit / Gross Profit / Gross Loss
  const r1 = getRow(1);
  const total_net_profit = parseNumber(r1[3]);
  const gross_profit = parseNumber(r1[7]);
  const gross_loss = parseNumber(r1[11]);

  // Row +2: Profit Factor / Expected Payoff
  const r2 = getRow(2);
  const profit_factor = parseNumber(r2[3]);
  const expected_payoff = parseNumber(r2[7]);

  // Row +3: Recovery Factor / Sharpe Ratio
  const r3 = getRow(3);
  const recovery_factor = parseNumber(r3[3]);
  const sharpe_ratio = parseNumber(r3[7]);

  // Row +5: Balance Drawdown Absolute / Maximal / Relative
  const r5 = getRow(5);
  const balance_drawdown_absolute = parseNumber(r5[3]);
  const ddMax = parseValuePct(r5[7]);   // "6 954.71 (6.01%)"
  const ddRel = parsePctValue(r5[11]);  // "6.01% (6 954.71)"

  // Row +6: Total Trades / Short Trades / Long Trades
  const r6 = getRow(6);
  const total_trades = parseNumber(r6[3]);
  const shortT = parseCountPct(r6[7]);   // "59 (59.32%)"
  const longT = parseCountPct(r6[11]);   // "62 (67.74%)"

  // Row +7: Profit Trades / Loss Trades
  const r7 = getRow(7);
  const profitT = parseCountPct(r7[7]);  // "77 (63.64%)"
  const lossT = parseCountPct(r7[11]);   // "44 (36.36%)"

  // Row +8: Largest profit/loss trade
  const r8 = getRow(8);
  const largest_profit_trade = parseNumber(r8[7]);
  const largest_loss_trade = parseNumber(r8[11]);

  // Row +9: Average profit/loss trade
  const r9 = getRow(9);
  const average_profit_trade = parseNumber(r9[7]);
  const average_loss_trade = parseNumber(r9[11]);

  // Row +10: Maximum consecutive wins/losses ($)
  const r10 = getRow(10);
  const consWins = parseCountMoney(r10[7]);   // "11 (13 408.38)"
  const consLosses = parseCountMoney(r10[11]); // "5 (-838.56)"

  // Row +11: Maximal consecutive profit/loss (count)
  const r11 = getRow(11);
  const maxProfit = parseMoneyCount(r11[7]);   // "13 408.38 (11)"
  const maxLoss = parseMoneyCount(r11[11]);    // "-6 954.71 (4)"

  return {
    total_net_profit: total_net_profit || null,
    gross_profit: gross_profit || null,
    gross_loss: gross_loss || null,
    profit_factor: profit_factor || null,
    expected_payoff: expected_payoff || null,
    recovery_factor: recovery_factor || null,
    sharpe_ratio: sharpe_ratio || null,
    balance_drawdown_absolute: balance_drawdown_absolute,
    balance_drawdown_maximal: ddMax.value || null,
    balance_drawdown_maximal_pct: ddMax.pct || null,
    balance_drawdown_relative_pct: ddRel.pct || null,
    balance_drawdown_relative: ddRel.value || null,
    total_trades: total_trades || null,
    short_trades: shortT.count || null,
    short_trades_won_pct: shortT.pct || null,
    long_trades: longT.count || null,
    long_trades_won_pct: longT.pct || null,
    profit_trades: profitT.count || null,
    profit_trades_pct: profitT.pct || null,
    loss_trades: lossT.count || null,
    loss_trades_pct: lossT.pct || null,
    largest_profit_trade: largest_profit_trade || null,
    largest_loss_trade: largest_loss_trade || null,
    average_profit_trade: average_profit_trade || null,
    average_loss_trade: average_loss_trade || null,
    max_consecutive_wins: consWins.count || null,
    max_consecutive_wins_money: consWins.money || null,
    max_consecutive_losses: consLosses.count || null,
    max_consecutive_losses_money: consLosses.money || null,
    max_consecutive_profit: maxProfit.money || null,
    max_consecutive_profit_count: maxProfit.count || null,
    max_consecutive_loss: maxLoss.money || null,
    max_consecutive_loss_count: maxLoss.count || null,
  };
}

/* ─────── Excel: parse completo ─────── */

export function parseExcel(buffer: Buffer): ParseResult {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const first = wb.SheetNames[0];
  if (!first) return { trades: [], summary: null };

  const sheet = wb.Sheets[first];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  if (isDooMtFormat(raw)) {
    const trades = parseDooMtPositions(raw);
    const accountInfo = parseAccountInfo(raw);
    const results = parseResultsSection(raw);
    const summary: ImportSummary = { ...accountInfo, ...(results ?? emptyResults()) };
    return { trades, summary };
  }

  // Formato genérico
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const trades: TradeInsert[] = [];
  for (const row of rows) {
    const t = rowToTrade(row);
    if (t) trades.push(t);
  }
  return { trades, summary: null };
}

/* ─────── CSV ─────── */

export function parseCsv(text: string): ParseResult {
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length) {
    return { trades: [], summary: null };
  }
  const trades: TradeInsert[] = [];
  for (const row of parsed.data) {
    const t = rowToTrade(row);
    if (t) trades.push(t);
  }
  return { trades, summary: null };
}

/* ─────── HTML ─────── */

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

function extractTableRows(tableHtml: string): string[][] {
  const rows: string[][] = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rm;
  while ((rm = rowRe.exec(tableHtml)) !== null) {
    const cellRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    const cells: string[] = [];
    let cm;
    while ((cm = cellRe.exec(rm[1])) !== null) {
      cells.push(stripHtml(cm[1]));
    }
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

export function parseHtml(html: string): ParseResult {
  const dateRe = /^\d{4}[.\-/]/;
  const tableRe = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tm;

  while ((tm = tableRe.exec(html)) !== null) {
    const rows = extractTableRows(tm[1]);
    if (rows.length < 2) continue;

    let headerIdx = -1;
    for (let h = 0; h < Math.min(rows.length, 5); h++) {
      const cells = rows[h].map((c) => c.toLowerCase());
      if (cells[0] === "time" && cells.includes("symbol") && cells.includes("profit")) {
        headerIdx = h;
        break;
      }
    }
    if (headerIdx < 0) continue;

    const headers = rows[headerIdx].map((c) => c.toLowerCase());
    const colSymbol = headers.indexOf("symbol");
    const colProfit = headers.indexOf("profit");
    const fp = headers.indexOf("price");
    const sp = fp >= 0 ? headers.indexOf("price", fp + 1) : -1;
    if (colSymbol < 0 || colProfit < 0) continue;

    // Detect second "time" column (exit time) if present
    const ft = headers.indexOf("time");
    const st = ft >= 0 ? headers.indexOf("time", ft + 1) : -1;

    const trades: TradeInsert[] = [];
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 5) continue;
      const firstCell = (row[0] ?? "").trim();
      if (!dateRe.test(firstCell)) break;

      const symbolVal = row[colSymbol] ?? "";
      const entry = fp >= 0 ? parseNumber(row[fp]) : 0;
      const exit = sp >= 0 ? parseNumber(row[sp]) : 0;
      const profit = parseNumber(row[colProfit]);
      if (!symbolVal) continue;
      const pair = symbolVal.replace(/\.c$/i, "").trim().toUpperCase();
      if (!pair) continue;

      const tradeDate = firstCell.split(" ")[0].replace(/\./g, "-");
      const is_win = profit >= 0;

      // Extract time info
      const entryDatetime = ft >= 0 ? (row[ft] ?? "").trim() : firstCell;
      const exitDatetime = st >= 0 ? (row[st] ?? "").trim() : "";
      const entry_time = extractTime(entryDatetime);
      const exit_time = exitDatetime ? extractTime(exitDatetime) : null;
      const duration_minutes = exitDatetime
        ? calcDurationMinutes(entryDatetime, exitDatetime)
        : null;

      trades.push({
        trade_date: tradeDate, pair,
        entry_price: entry, exit_price: exit,
        pips: calcPips(pair, entry, exit, is_win, profit),
        is_win,
        entry_time,
        exit_time,
        duration_minutes,
        profit_dollar: profit !== 0 ? profit : null,
      });
    }
    if (trades.length > 0) return { trades, summary: null };
  }

  // Se não encontrou tabelas, checa se é formato JSON embutido (broker web)
  const htmlJsonOnly = /window\.__report\s*=/.test(html);
  return { trades: [], summary: null, htmlJsonOnly };
}

/* ─────── Helpers genéricos ─────── */

function rowToTrade(row: Record<string, unknown>): TradeInsert | null {
  const keys = Object.keys(row).map((k) => k.toLowerCase());
  const get = (...names: string[]) => {
    const key = keys.find((k) => names.some((n) => k.includes(n) || n.includes(k)));
    return key ? row[Object.keys(row).find((k) => k.toLowerCase() === key)!] : undefined;
  };

  const trade_date = String(get("trade_date", "date", "time") ?? "").trim().split(" ")[0];
  const pair = String(get("pair", "symbol", "instrument") ?? "").trim().toUpperCase();
  const entry_price = parseNumber(get("entry_price", "entry", "open", "price"));
  const exit_price = parseNumber(get("exit_price", "exit", "close"));
  let pips = parseNumber(get("pips", "pip"));
  const is_win = parseBool(get("is_win", "win", "profit", "result"));
  const risk_reward = get("risk_reward", "rr", "r:r") ? parseNumber(get("risk_reward", "rr", "r:r")) : undefined;
  const tags = parseTags(get("tags", "tag", "setup"));
  const notes = get("notes", "note") ? String(get("notes", "note")).trim() : undefined;

  if (!trade_date || !pair) return null;

  if (pips === 0 && entry_price !== 0 && exit_price !== 0) {
    pips = Math.abs(exit_price - entry_price) * 10000;
    if (pair.includes("JPY")) pips *= 0.01;
    pips = is_win ? Math.abs(pips) : -Math.abs(pips);
  } else {
    pips = is_win ? Math.abs(pips) : -Math.abs(pips);
  }

  return { trade_date, pair, entry_price, exit_price, pips, is_win, risk_reward, tags: tags.length ? tags : undefined, notes };
}

function emptyResults(): Omit<ImportSummary, keyof AccountInfo> {
  return {
    total_net_profit: null, gross_profit: null, gross_loss: null,
    profit_factor: null, expected_payoff: null, recovery_factor: null, sharpe_ratio: null,
    balance_drawdown_absolute: null, balance_drawdown_maximal: null, balance_drawdown_maximal_pct: null,
    balance_drawdown_relative_pct: null, balance_drawdown_relative: null,
    total_trades: null, short_trades: null, short_trades_won_pct: null,
    long_trades: null, long_trades_won_pct: null,
    profit_trades: null, profit_trades_pct: null, loss_trades: null, loss_trades_pct: null,
    largest_profit_trade: null, largest_loss_trade: null,
    average_profit_trade: null, average_loss_trade: null,
    max_consecutive_wins: null, max_consecutive_wins_money: null,
    max_consecutive_losses: null, max_consecutive_losses_money: null,
    max_consecutive_profit: null, max_consecutive_profit_count: null,
    max_consecutive_loss: null, max_consecutive_loss_count: null,
  };
}
