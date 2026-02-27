/**
 * AI Fallback Agent: Header Mapper
 * When the standard synonym-based parser fails to detect trade columns,
 * this agent uses GPT-4o-mini to intelligently map unknown headers.
 * Cost: ~$0.001 per call. Free for users (internal infrastructure).
 */
import { chatCompletion } from "../client";

export type HeaderMapping = {
  timeCol: number;
  symbolCol: number;
  profitCol: number;
  priceCol: number;
  priceExitCol: number;
  typeCol: number;
  success: boolean;
};

/**
 * Given raw headers and sample data rows, ask AI to identify column mappings.
 * Returns column indices for Time, Symbol, Profit, Price, etc.
 */
export async function mapHeadersWithAI(
  headers: string[],
  sampleRows: string[][],
): Promise<HeaderMapping> {
  const headersStr = headers.map((h, i) => `[${i}] "${h}"`).join(", ");
  const samplesStr = sampleRows
    .slice(0, 3)
    .map((row, i) => `Row ${i}: ${row.map((c, j) => `[${j}]=${c}`).join(", ")}`)
    .join("\n");

  const prompt = `You are analyzing a trading report (MT4/MT5/broker export). Given the column headers and sample data rows below, identify which column index corresponds to each field.

HEADERS: ${headersStr}

SAMPLE DATA:
${samplesStr}

Respond ONLY with a JSON object (no markdown, no explanation):
{
  "timeCol": <index of the date/time column, or -1 if not found>,
  "symbolCol": <index of the trading pair/symbol column, or -1>,
  "profitCol": <index of the profit/loss column, or -1>,
  "priceCol": <index of the entry/open price column, or -1>,
  "priceExitCol": <index of the exit/close price column, or -1>,
  "typeCol": <index of the buy/sell type column, or -1>
}

RULES:
- Time column contains dates like "2025.07.10 18:39:33"
- Symbol column contains trading pairs like "EURUSD", "XAUUSD", "GBPJPY"
- Profit column contains positive/negative numbers (the P&L result)
- Price columns contain decimal numbers (entry and exit prices)
- Type column contains "buy"/"sell" or "0"/"1"
- If there are two Time columns, use the first one for timeCol
- If there are two Price columns, use the first for priceCol and second for priceExitCol
- Headers may be in any language (Portuguese, Spanish, French, Italian, German, etc)`;

  try {
    const response = await chatCompletion(
      [{ role: "user", content: prompt }],
      { model: "gpt-4o-mini", maxTokens: 200 },
    );

    // Parse JSON response
    const cleaned = response.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned) as Record<string, number>;

    return {
      timeCol: parsed.timeCol ?? -1,
      symbolCol: parsed.symbolCol ?? -1,
      profitCol: parsed.profitCol ?? -1,
      priceCol: parsed.priceCol ?? -1,
      priceExitCol: parsed.priceExitCol ?? -1,
      typeCol: parsed.typeCol ?? -1,
      success:
        (parsed.timeCol ?? -1) >= 0 &&
        (parsed.symbolCol ?? -1) >= 0 &&
        (parsed.profitCol ?? -1) >= 0,
    };
  } catch {
    return {
      timeCol: -1,
      symbolCol: -1,
      profitCol: -1,
      priceCol: -1,
      priceExitCol: -1,
      typeCol: -1,
      success: false,
    };
  }
}
