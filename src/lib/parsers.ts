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
  ticket?: string | null;
  swap?: number;
  commission?: number;
  source?: string;
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

function calcPips(
  pair: string,
  entry: number,
  exit: number,
  isWin: boolean,
  profit: number,
  tradeType?: string
): number {
  if (entry !== 0 && exit !== 0) {
    const isGold = /xau|gold/i.test(pair);
    const isSilver = /xag|silver/i.test(pair);
    const isJpy = pair.includes("JPY");
    const pipMultiplier = (isGold || isSilver || isJpy) ? 100 : 10000;

    let pips: number;
    if (tradeType === "buy") {
      pips = (exit - entry) * pipMultiplier;
    } else if (tradeType === "sell") {
      pips = (entry - exit) * pipMultiplier;
    } else {
      // Fallback: use absolute diff with is_win sign
      const diff = Math.abs(exit - entry) * pipMultiplier;
      pips = isWin ? diff : -diff;
    }
    return Math.round(pips * 10) / 10;
  }
  return isWin ? Math.abs(profit) : -Math.abs(profit);
}

/* ─────── Multilingual MT5 Header Synonyms ─────── */
/* MT5 exports identical structure in all languages — only header text changes.
   Covers: EN, ES, PT-BR, PT, FR, DE, IT, RU, ZH, JA, KO, AR, TR, PL, CZ, NL
   Uses 2-pass matching: exact → loose (contains) for maximum compatibility. */

const TIME_SYNONYMS = [
  // EN
  "time", "date/time", "date", "open time", "close time",
  // ES — MT5: "Hora", "Fecha/Hora"
  "fecha/hora", "fecha",
  // PT-BR — MT5: "Horário", "Data/Hora"
  "data/hora", "hora", "horário", "horario", "data",
  // FR — MT5: "Heure", "Date/Heure"
  "date/heure", "heure",
  // DE — MT5: "Zeit", "Datum/Zeit"
  "zeit", "datum/zeit",
  // IT — MT5: "Ora", "Data/Ora"
  "data/ora", "ora",
  // RU/ZH/JA/KO/AR/TR/PL/CZ/NL/SV/FI
  "время", "时间", "日時", "시간", "الوقت", "tarih/saat", "czas",
  "čas", "datum/tijd", "tid", "aika",
];

const SYMBOL_SYNONYMS = [
  // EN
  "symbol", "instrument", "asset", "pair",
  // ES — MT5: "Símbolo"
  "símbolo",
  // PT-BR — MT5: "Ativo", "Símbolo"
  "ativo", "instrumento",
  // FR — MT5: "Symbole"
  "symbole",
  // DE — MT5: "Symbol"
  // IT — MT5: "Simbolo"
  "simbolo",
  // Other
  "par", "символ", "交易品种", "品种", "通貨ペア", "銘柄", "심볼",
  "الرمز", "sembol", "symbool", "シンボル",
];

const PROFIT_SYNONYMS = [
  // EN
  "profit", "result", "p/l", "pnl", "net profit",
  // ES — MT5: "Beneficio"
  "beneficio",
  // PT-BR — MT5: "Lucro"
  "lucro", "resultado", "ganho", "lucro líquido", "lucro liquido",
  // FR — MT5: "Bénéfice"
  "bénéfice", "benefice",
  // DE — MT5: "Gewinn"
  "gewinn",
  // IT — MT5: "Profitto"
  "profitto",
  // Other
  "прибыль", "利润", "盈利", "損益", "利益", "수익", "이익",
  "الربح", "kâr", "kar", "zysk", "zisk", "winst",
];

const PRICE_SYNONYMS = [
  // EN
  "price", "open", "close",
  // ES — MT5: "Precio"
  "precio",
  // PT-BR — MT5: "Preço"
  "preço", "preco", "abertura", "fechamento", "entrada", "saída", "saida",
  // FR — MT5: "Prix"
  "prix",
  // DE — MT5: "Preis"
  "preis",
  // IT — MT5: "Prezzo"
  "prezzo",
  // Other
  "цена", "价格", "価格", "가격", "السعر", "fiyat", "cena", "prijs",
];

const TYPE_SYNONYMS = [
  // EN/ES/PT/IT
  "type", "tipo",
  // DE
  "typ",
  // Other
  "тип", "类型", "タイプ", "유형", "النوع", "tip", "rodzaj", "soort",
];

const COMMISSION_SYNONYMS = [
  "commission", "comissão", "comissao", "comision", "comisión", "commissione",
  "kommission", "provision", "провизия", "комиссия", "佣金", "手数料",
  "수수료", "komisyon", "prowizja",
];

const SWAP_SYNONYMS = [
  "swap", "перенос", "своп", "掉期", "スワップ", "스왑", "takas",
];

const POSITION_SYNONYMS = [
  "position", "posicion", "posición", "posicao", "posição", "pos",
  "позиция", "仓位", "ポジション", "포지션", "pozisyon",
];

const RESULTS_SYNONYMS = [
  "results", "resultados", "résultats", "resultats", "ergebnisse",
  "risultati", "результаты", "结果", "結果", "결과", "النتائج", "sonuçlar",
  "wyniki", "výsledky", "resultaten",
];

/** Keywords in the title row that indicate a trading history report */
const TITLE_TRADE_KW = [
  "trade", "trading", "negociação", "negociacion", "negociación",
  "negoziazione", "handel", "торговл", "交易", "取引", "거래", "işlem", "handels",
];
const TITLE_HISTORY_KW = [
  "history", "historial", "histórico", "historico", "historique",
  "storico", "historie", "storia", "истори", "历史", "履歴", "내역", "geçmiş", "gecmis",
];
const TITLE_REPORT_KW = [
  "report", "informe", "relatório", "relatorio", "rapport",
  "bericht", "rapporto", "отчет", "отчёт", "报告", "レポート", "보고서", "rapor",
];

/** Normalize header: lowercase, trim, collapse spaces around separators */
function normalizeHeader(cell: string): string {
  return cell
    .toLowerCase()
    .trim()
    .replace(/\s*[\/\\]\s*/g, "/")   // "Data / Hora" → "data/hora"
    .replace(/\s+/g, " ");            // multiple spaces → single
}

/** Check if a header cell matches any synonym (exact or boundary match) */
function matchesSyn(cell: string, syns: string[]): boolean {
  const norm = normalizeHeader(cell);
  return syns.some((s) => norm === s || norm.startsWith(s + " ") || norm.endsWith(" " + s));
}

/** Loose match: synonym appears anywhere in the cell (fallback for non-standard headers) */
function matchesSynLoose(cell: string, syns: string[]): boolean {
  const norm = normalizeHeader(cell);
  return syns.some((s) => norm.includes(s));
}

/** Find index of a column whose header matches any synonym (exact first, loose fallback) */
function findCol(headers: string[], syns: string[]): number {
  const exact = headers.findIndex((h) => matchesSyn(h, syns));
  if (exact >= 0) return exact;
  return headers.findIndex((h) => matchesSynLoose(h, syns));
}

/* ─────── Excel: Detecção e parsing Doo/MT ─────── */

function findPositionsHeaderRow(raw: unknown[][]): number {
  const max = Math.min(raw.length, 30);

  // Pass 1: exact/boundary match (high confidence)
  for (let i = 0; i < max; i++) {
    const row = raw[i] as unknown[];
    if (!Array.isArray(row) || row.length < 4) continue;
    const cells = row.map((c) => normalizeHeader(String(c ?? "")));
    const hasTime = cells.some((c) => matchesSyn(c, TIME_SYNONYMS));
    const hasSymbol = cells.some((c) => matchesSyn(c, SYMBOL_SYNONYMS));
    const hasProfit = cells.some((c) => matchesSyn(c, PROFIT_SYNONYMS));
    if (hasTime && hasSymbol && hasProfit) return i;
  }

  // Pass 2: loose/contains match (fallback for non-standard headers)
  for (let i = 0; i < max; i++) {
    const row = raw[i] as unknown[];
    if (!Array.isArray(row) || row.length < 4) continue;
    const cells = row.map((c) => normalizeHeader(String(c ?? "")));
    const hasTime = cells.some((c) => matchesSynLoose(c, TIME_SYNONYMS));
    const hasSymbol = cells.some((c) => matchesSynLoose(c, SYMBOL_SYNONYMS));
    const hasProfit = cells.some((c) => matchesSynLoose(c, PROFIT_SYNONYMS));
    if (hasTime && hasSymbol && hasProfit) return i;
  }

  // Pass 3: Positional MT5 detection — MT5 ALWAYS uses fixed column layout:
  // A=Time B=Position C=Symbol D=Type E=Volume F=Price G=S/L H=T/P I=Time J=Price K=Commission L=Swap M=Profit
  // Header is always after metadata rows (title, name, account, company, date, section title).
  // Detect by: row has 13+ non-empty cells as text, and the NEXT row starts with a date.
  const dateRe = /^\d{4}[.\-/]/;
  for (let i = 4; i < Math.min(max, 15); i++) {
    const row = raw[i] as unknown[];
    if (!Array.isArray(row)) continue;
    const cells = row.map((c) => String(c ?? "").trim());
    const nonEmpty = cells.filter(Boolean).length;
    // Header row: 10+ non-empty text cells, first cell is NOT a date
    if (nonEmpty < 10 || dateRe.test(cells[0])) continue;
    // Verify next row starts with a date (data row)
    const nextRow = raw[i + 1] as unknown[] | undefined;
    if (!nextRow) continue;
    const nextFirst = String(nextRow[0] ?? "").trim();
    if (dateRe.test(nextFirst)) return i;
  }

  return -1;
}

export function isDooMtFormat(raw: unknown[][]): boolean {
  if (raw.length < 5) return false;
  const first = String((raw[0] ?? [])[0] ?? "").toLowerCase();
  // Check title for trade/history/report keywords in any language
  const hasTrade = TITLE_TRADE_KW.some((k) => first.includes(k));
  const hasHistory = TITLE_HISTORY_KW.some((k) => first.includes(k));
  const hasReport = TITLE_REPORT_KW.some((k) => first.includes(k));
  if ((hasTrade && hasHistory) || (hasTrade && hasReport) || (hasHistory && hasReport)) return true;
  return findPositionsHeaderRow(raw) >= 0;
}

export function parseDooMtPositions(raw: unknown[][]): TradeInsert[] {
  const trades: TradeInsert[] = [];
  const headerIdx = findPositionsHeaderRow(raw);
  if (headerIdx < 0) return trades;

  const headerRow = (raw[headerIdx] as unknown[]).map((c) => normalizeHeader(String(c ?? "")));
  const colSymbol = findCol(headerRow, SYMBOL_SYNONYMS);
  const colProfit = findCol(headerRow, PROFIT_SYNONYMS);
  const colType = findCol(headerRow, TYPE_SYNONYMS);
  const colSL = headerRow.findIndex((c) => /s\s*[\/.]\s*l|l\s*[\/.]\s*s|stop\s*loss|sl\b/i.test(c));
  const colTP = headerRow.findIndex((c) => /t\s*[\/.]\s*p|p\s*[\/.]\s*t|take\s*profit|tp\b/i.test(c));
  const fp = findCol(headerRow, PRICE_SYNONYMS);
  const sp = fp >= 0 ? headerRow.findIndex((c, i) => i > fp && matchesSyn(c, PRICE_SYNONYMS)) : -1;
  // RC2: Commission and Swap columns (MT5 XLSX cols K and L)
  const colCommission = findCol(headerRow, COMMISSION_SYNONYMS);
  const colSwap = findCol(headerRow, SWAP_SYNONYMS);
  // RC7: Position ID / ticket column (MT5 XLSX col B)
  const colPosition = findCol(headerRow, POSITION_SYNONYMS);
  if (colSymbol < 0 || colProfit < 0) return trades;

  // Detect second "time" column (exit time) if present
  const ft = findCol(headerRow, TIME_SYNONYMS);
  const st = ft >= 0 ? headerRow.findIndex((c, i) => i > ft && matchesSyn(c, TIME_SYNONYMS)) : -1;

  const dateRe = /^\d{4}[.\-/]/;
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i] as unknown[];
    if (!Array.isArray(row) || row.length < 5) continue;
    const firstCell = String(row[0] ?? "").trim();
    if (!dateRe.test(firstCell)) break;

    const symbolVal = row[colSymbol];
    const entry = fp >= 0 ? parseNumber(row[fp]) : 0;
    const exit = sp >= 0 ? parseNumber(row[sp]) : 0;
    const rawProfit = parseNumber(row[colProfit]);
    // RC2: Include Commission + Swap in total profit (fallback to 0 if columns absent)
    const swapVal = colSwap >= 0 ? parseNumber(row[colSwap]) : 0;
    const commissionVal = colCommission >= 0 ? parseNumber(row[colCommission]) : 0;
    const totalProfit = rawProfit + swapVal + commissionVal;
    // RC7: Extract Position ID (ticket) from XLSX col B
    const ticket = colPosition >= 0 ? String(row[colPosition] ?? "").trim() || null : null;
    if (!symbolVal) continue;
    const pair = String(symbolVal).replace(/\.[a-z]+$/i, "").replace(/[_\-\s]/g, "").trim().toUpperCase();
    if (!pair) continue;

    const tradeDate = firstCell.split(" ")[0].replace(/\./g, "-");
    // RC4: breakeven is NOT a win (totalProfit > 0, not >= 0)
    const is_win = totalProfit > 0;

    // RC5: Extract trade type for directional pips calculation
    const typeStr = colType >= 0 ? String(row[colType] ?? "").toLowerCase().trim() : "";
    const tradeType = typeStr === "buy" || typeStr === "0" ? "buy"
      : typeStr === "sell" || typeStr === "1" ? "sell"
      : undefined;

    // R-múltiplo planejado a partir de S/L e T/P (quando disponíveis)
    let risk_reward: number | undefined;
    if (colSL >= 0 && colTP >= 0 && entry > 0) {
      const sl = parseNumber(row[colSL]);
      const tp = parseNumber(row[colTP]);
      const isBuy = tradeType === "buy" || (!tradeType && (is_win ? exit > entry : exit < entry));
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
      // RC5: Pass tradeType for directional pips
      pips: calcPips(pair, entry, exit, is_win, totalProfit, tradeType),
      is_win,
      entry_time,
      exit_time,
      duration_minutes,
      // RC6: Always use totalProfit (0 for breakeven, never null)
      profit_dollar: totalProfit,
      risk_reward: risk_reward ?? undefined,
      // RC7: Position ID as ticket
      ticket,
      // RC2: Store swap and commission separately
      swap: swapVal,
      commission: commissionVal,
      source: "import",
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
  // Encontra a linha "Results" (multilingual)
  let resultsIdx = -1;
  for (let i = raw.length - 1; i >= 0; i--) {
    const cell = String((raw[i] as unknown[])?.[0] ?? "").toLowerCase().trim();
    if (matchesSyn(cell, RESULTS_SYNONYMS)) {
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
    const cellRe = /<t[dh]([^>]*)>([\s\S]*?)<\/t[dh]>/gi;
    const cells: string[] = [];
    let cm;
    while ((cm = cellRe.exec(rm[1])) !== null) {
      const attrs = cm[1];
      // Skip hidden cells (MT5 uses class="hidden" for collapsed data)
      if (/class\s*=\s*"[^"]*hidden[^"]*"/i.test(attrs)) continue;
      const text = stripHtml(cm[2]);
      cells.push(text);
      // Expand colspan for data cells (colspan <= 3, e.g. Profit colspan=2)
      const colspanMatch = attrs.match(/colspan\s*=\s*"(\d+)"/i);
      const colspan = colspanMatch ? parseInt(colspanMatch[1], 10) : 1;
      if (colspan > 1 && colspan <= 3) {
        for (let c = 1; c < colspan; c++) cells.push("");
      }
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
    // Pass 1: exact/boundary match
    for (let h = 0; h < Math.min(rows.length, 10); h++) {
      const cells = rows[h].map((c) => normalizeHeader(c));
      const hasTime = cells.some((c) => matchesSyn(c, TIME_SYNONYMS));
      const hasSymbol = cells.some((c) => matchesSyn(c, SYMBOL_SYNONYMS));
      const hasProfit = cells.some((c) => matchesSyn(c, PROFIT_SYNONYMS));
      if (hasTime && hasSymbol && hasProfit) { headerIdx = h; break; }
    }
    // Pass 2: loose match fallback
    if (headerIdx < 0) {
      for (let h = 0; h < Math.min(rows.length, 10); h++) {
        const cells = rows[h].map((c) => normalizeHeader(c));
        const hasTime = cells.some((c) => matchesSynLoose(c, TIME_SYNONYMS));
        const hasSymbol = cells.some((c) => matchesSynLoose(c, SYMBOL_SYNONYMS));
        const hasProfit = cells.some((c) => matchesSynLoose(c, PROFIT_SYNONYMS));
        if (hasTime && hasSymbol && hasProfit) { headerIdx = h; break; }
      }
    }
    if (headerIdx < 0) continue;

    const headers = rows[headerIdx].map((c) => normalizeHeader(c));
    const colSymbol = findCol(headers, SYMBOL_SYNONYMS);
    const colProfit = findCol(headers, PROFIT_SYNONYMS);
    const fp = findCol(headers, PRICE_SYNONYMS);
    const sp = fp >= 0 ? headers.findIndex((c, i) => i > fp && matchesSyn(c, PRICE_SYNONYMS)) : -1;
    if (colSymbol < 0 || colProfit < 0) continue;

    // RC2: Commission and Swap columns for HTML
    const htmlColCommission = findCol(headers, COMMISSION_SYNONYMS);
    const htmlColSwap = findCol(headers, SWAP_SYNONYMS);
    // RC7: Position ID / ticket column
    const htmlColPosition = findCol(headers, POSITION_SYNONYMS);
    // Trade type column
    const htmlColType = findCol(headers, TYPE_SYNONYMS);

    // Detect second "time" column (exit time) if present
    const ft = findCol(headers, TIME_SYNONYMS);
    const st = ft >= 0 ? headers.findIndex((c, i) => i > ft && matchesSyn(c, TIME_SYNONYMS)) : -1;

    const trades: TradeInsert[] = [];
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 5) continue;
      const firstCell = (row[0] ?? "").trim();
      if (!dateRe.test(firstCell)) break;

      const symbolVal = row[colSymbol] ?? "";
      const entry = fp >= 0 ? parseNumber(row[fp]) : 0;
      const exit = sp >= 0 ? parseNumber(row[sp]) : 0;
      const rawProfit = parseNumber(row[colProfit]);
      // RC2: Include Commission + Swap
      const htmlSwapVal = htmlColSwap >= 0 ? parseNumber(row[htmlColSwap]) : 0;
      const htmlCommVal = htmlColCommission >= 0 ? parseNumber(row[htmlColCommission]) : 0;
      const totalProfit = rawProfit + htmlSwapVal + htmlCommVal;
      // RC7: Extract ticket
      const htmlTicket = htmlColPosition >= 0 ? (row[htmlColPosition] ?? "").trim() || null : null;
      if (!symbolVal) continue;
      const pair = symbolVal.replace(/\.[a-z]+$/i, "").replace(/[_\-\s]/g, "").trim().toUpperCase();
      if (!pair) continue;

      const tradeDate = firstCell.split(" ")[0].replace(/\./g, "-");
      // RC4: breakeven is NOT a win
      const is_win = totalProfit > 0;

      // RC5: Extract trade type for directional pips
      const htmlTypeStr = htmlColType >= 0 ? (row[htmlColType] ?? "").toLowerCase().trim() : "";
      const htmlTradeType = htmlTypeStr === "buy" || htmlTypeStr === "0" ? "buy"
        : htmlTypeStr === "sell" || htmlTypeStr === "1" ? "sell"
        : undefined;

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
        pips: calcPips(pair, entry, exit, is_win, totalProfit, htmlTradeType),
        is_win,
        entry_time,
        exit_time,
        duration_minutes,
        // RC6: Always store totalProfit (0 for breakeven, never null)
        profit_dollar: totalProfit,
        ticket: htmlTicket,
        swap: htmlSwapVal,
        commission: htmlCommVal,
        source: "import",
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

  const trade_date = String(get("trade_date", "date", "time", "fecha", "data", "datum", "zeit", "時間", "日時") ?? "").trim().split(" ")[0];
  const pair = String(get("pair", "symbol", "instrument", "símbolo", "simbolo", "symbole", "品种") ?? "")
    .replace(/\.[a-z]+$/i, "").replace(/[_\-\s]/g, "").trim().toUpperCase();
  const entry_price = parseNumber(get("entry_price", "entry", "open", "price", "precio", "preço", "prix", "preis"));
  const exit_price = parseNumber(get("exit_price", "exit", "close", "cierre", "fechamento"));
  let pips = parseNumber(get("pips", "pip"));
  const profitVal = parseNumber(get("profit_dollar", "profit", "pnl", "p/l"));
  // RC4: For generic parser, use profit value if available; otherwise use parseBool
  const is_win = profitVal !== 0 ? profitVal > 0 : parseBool(get("is_win", "win", "result"));
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

  return {
    trade_date, pair, entry_price, exit_price, pips, is_win, risk_reward,
    tags: tags.length ? tags : undefined, notes,
    // RC6: Store profit value (0 for breakeven, never null)
    profit_dollar: profitVal,
    source: "import",
  };
}

/** Diagnose why header detection failed — returns detected vs missing columns */
export function diagnoseHeaders(buffer: Buffer, format: "excel" | "csv" | "html"): string {
  let firstRows: string[][] = [];

  if (format === "excel") {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const first = wb.SheetNames[0];
    if (first) {
      const sheet = wb.Sheets[first];
      const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
      firstRows = raw.slice(0, 20).map((r) =>
        (r as unknown[]).map((c) => String(c ?? "").trim()).filter(Boolean)
      );
    }
  } else if (format === "csv") {
    const lines = buffer.toString("utf-8").split("\n").slice(0, 20);
    firstRows = lines.map((l) => l.split(/[,;\t]/).map((c) => c.trim()).filter(Boolean));
  } else {
    const html = buffer.toString("utf-8");
    const tableRe = /<table[^>]*>([\s\S]*?)<\/table>/i;
    const tm = tableRe.exec(html);
    if (tm) {
      firstRows = extractTableRows(tm[1]).slice(0, 10);
    }
  }

  // Collect all unique non-empty cells from first rows
  const allHeaders = new Set<string>();
  for (const row of firstRows) {
    for (const cell of row) {
      const norm = normalizeHeader(cell);
      if (norm && !/^\d/.test(norm) && norm.length < 40) allHeaders.add(cell);
    }
  }

  const detected: string[] = [];
  const missing: string[] = [];
  const headerArr = Array.from(allHeaders);

  const checkGroup = (name: string, syns: string[]) => {
    const found = headerArr.some(
      (h) => matchesSyn(normalizeHeader(h), syns) || matchesSynLoose(normalizeHeader(h), syns)
    );
    if (found) detected.push(name);
    else missing.push(name);
  };

  checkGroup("Time", TIME_SYNONYMS);
  checkGroup("Symbol", SYMBOL_SYNONYMS);
  checkGroup("Profit", PROFIT_SYNONYMS);
  checkGroup("Price", PRICE_SYNONYMS);

  const headerSample = headerArr.slice(0, 15).join(", ");
  let msg = `Headers encontrados no arquivo: [${headerSample}].`;
  if (detected.length > 0) msg += ` Colunas reconhecidas: ${detected.join(", ")}.`;
  if (missing.length > 0) msg += ` Colunas não encontradas: ${missing.join(", ")}.`;
  msg += " Certifique-se de que o relatório contém colunas de Time/Data, Symbol/Símbolo e Profit/Lucro.";
  return msg;
}

/* ─────── AI Fallback: parse with AI-provided column mapping ─────── */

export type AIColumnMapping = {
  timeCol: number;
  symbolCol: number;
  profitCol: number;
  priceCol: number;
  priceExitCol: number;
  typeCol: number;
};

/** Extract raw rows from any format (for AI fallback) */
export function extractRawRows(
  buffer: Buffer,
  format: "excel" | "csv" | "html",
): { headers: string[]; dataRows: string[][] } {
  if (format === "excel") {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const first = wb.SheetNames[0];
    if (!first) return { headers: [], dataRows: [] };
    const sheet = wb.Sheets[first];
    const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
    // Find the first row with 4+ non-empty cells that looks like headers
    for (let i = 0; i < Math.min(raw.length, 30); i++) {
      const row = (raw[i] as unknown[]).map((c) => String(c ?? "").trim());
      const nonEmpty = row.filter(Boolean);
      if (nonEmpty.length >= 4 && !/^\d{4}[.\-/]/.test(row[0])) {
        const dataRows = raw.slice(i + 1, i + 6).map((r) =>
          (r as unknown[]).map((c) => String(c ?? "").trim()),
        );
        return { headers: row, dataRows };
      }
    }
    return { headers: [], dataRows: [] };
  }

  if (format === "html") {
    const html = buffer.toString("utf-8");
    const tableRe = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let tm;
    while ((tm = tableRe.exec(html)) !== null) {
      const rows = extractTableRows(tm[1]);
      if (rows.length < 2) continue;
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const row = rows[i];
        if (row.length >= 4 && !/^\d{4}[.\-/]/.test(row[0])) {
          const dataRows = rows.slice(i + 1, i + 6);
          return { headers: row, dataRows };
        }
      }
    }
    return { headers: [], dataRows: [] };
  }

  // CSV
  const lines = buffer.toString("utf-8").split("\n").filter(Boolean);
  if (lines.length < 2) return { headers: [], dataRows: [] };
  const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map((c) => c.trim());
  const dataRows = lines.slice(1, 6).map((l) => l.split(sep).map((c) => c.trim()));
  return { headers, dataRows };
}

/** Parse trades using AI-provided column indices */
export function parseWithAIMapping(
  buffer: Buffer,
  format: "excel" | "csv" | "html",
  mapping: AIColumnMapping,
): ParseResult {
  const { timeCol, symbolCol, profitCol, priceCol, priceExitCol } = mapping;
  if (timeCol < 0 || symbolCol < 0 || profitCol < 0) {
    return { trades: [], summary: null };
  }

  const dateRe = /^\d{4}[.\-/]/;
  const trades: TradeInsert[] = [];

  const processRow = (row: string[]) => {
    const timeVal = (row[timeCol] ?? "").trim();
    if (!dateRe.test(timeVal)) return;

    const symbolVal = (row[symbolCol] ?? "").trim();
    if (!symbolVal) return;
    const pair = symbolVal.replace(/\.[a-z]+$/i, "").replace(/[_\-\s]/g, "").trim().toUpperCase();
    if (!pair) return;

    const profit = parseNumber(row[profitCol]);
    const entry = priceCol >= 0 ? parseNumber(row[priceCol]) : 0;
    const exit = priceExitCol >= 0 ? parseNumber(row[priceExitCol]) : 0;
    const tradeDate = timeVal.split(" ")[0].replace(/\./g, "-");
    // RC4: breakeven is NOT a win
    const is_win = profit > 0;
    const entry_time = extractTime(timeVal);

    // RC5: Extract trade type from mapping if available
    const aiTypeStr = mapping.typeCol >= 0 ? (row[mapping.typeCol] ?? "").toLowerCase().trim() : "";
    const aiTradeType = aiTypeStr === "buy" || aiTypeStr === "0" ? "buy"
      : aiTypeStr === "sell" || aiTypeStr === "1" ? "sell"
      : undefined;

    trades.push({
      trade_date: tradeDate,
      pair,
      entry_price: entry,
      exit_price: exit,
      pips: calcPips(pair, entry, exit, is_win, profit, aiTradeType),
      is_win,
      entry_time,
      exit_time: null,
      duration_minutes: null,
      // RC6: Always store profit (0 for breakeven, never null)
      profit_dollar: profit,
      source: "import",
    });
  };

  if (format === "excel") {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const first = wb.SheetNames[0];
    if (!first) return { trades: [], summary: null };
    const sheet = wb.Sheets[first];
    const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
    // Find header row, then process data rows
    for (let i = 0; i < Math.min(raw.length, 30); i++) {
      const row = (raw[i] as unknown[]).map((c) => String(c ?? "").trim());
      if (row.length >= 4 && !/^\d{4}[.\-/]/.test(row[0]) && row.filter(Boolean).length >= 4) {
        // This is likely the header row, process rows after it
        for (let j = i + 1; j < raw.length; j++) {
          const dataRow = (raw[j] as unknown[]).map((c) => String(c ?? "").trim());
          processRow(dataRow);
        }
        break;
      }
    }
  } else if (format === "html") {
    const html = buffer.toString("utf-8");
    const tableRe = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let tm;
    while ((tm = tableRe.exec(html)) !== null) {
      const rows = extractTableRows(tm[1]);
      // Find header row, then process data
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        if (rows[i].length >= 4 && !/^\d{4}[.\-/]/.test(rows[i][0])) {
          for (let j = i + 1; j < rows.length; j++) {
            processRow(rows[j]);
          }
          if (trades.length > 0) return { trades, summary: null };
          break;
        }
      }
    }
  } else {
    // CSV
    const lines = buffer.toString("utf-8").split("\n").filter(Boolean);
    for (let i = 1; i < lines.length; i++) {
      const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
      processRow(lines[i].split(sep).map((c) => c.trim()));
    }
  }

  return { trades, summary: null };
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
