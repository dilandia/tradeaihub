/**
 * Utilitários para formatação de moedas
 * IMPORTANTE: Sempre usa en-US locale para preços de Stripe (USD)
 */

/**
 * Formata um número como preço em USD
 * @param value - Valor numérico ou string
 * @param options - Opções de formatação (fractionDigits, etc)
 * @returns String formatada em USD (ex: "$14.90")
 */
export function formatUsdPrice(
  value: number | string,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(num)) return "$0.00";
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(num);
}

/**
 * Formata um número como preço genérico
 * IMPORTANTE: Para preços de Stripe/subscriptions, SEMPRE use formatUsdPrice()
 * 
 * @param value - Valor numérico
 * @param locale - Locale para formatação
 * @param options - Opções de formatação
 * @returns String formatada
 */
export function formatPrice(
  value: number,
  locale: string = "en-US",
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  return new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(value);
}

/**
 * Supported currencies for multi-currency checkout
 */
export const SUPPORTED_CURRENCIES = ["usd", "brl", "eur"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const CURRENCY_LOCALE_MAP: Record<SupportedCurrency, string> = {
  usd: "en-US",
  brl: "pt-BR",
  eur: "de-DE",
};

/**
 * Formats a numeric value as a currency string using the appropriate locale.
 * @param value - Amount in major units (e.g. 14.90, not 1490 cents)
 * @param currency - Currency code: "usd", "brl", or "eur"
 * @returns Formatted string (e.g. "$14.90", "R$79,90", "12,90 EUR")
 */
export function formatCurrencyAmount(
  value: number,
  currency: string
): string {
  const cur = currency.toLowerCase() as SupportedCurrency;
  const locale = CURRENCY_LOCALE_MAP[cur] ?? "en-US";
  const currencyCode = cur === "usd" ? "USD" : cur === "brl" ? "BRL" : cur === "eur" ? "EUR" : "USD";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Converte um preço de string/número para sempre usar Intl com en-US
 * Útil para garantir que preços de Stripe sempre aparecem em USD
 */
export function ensureUsdFormat(priceStr: string): string {
  // Se já começa com $, retorna como está
  if (priceStr.startsWith("$")) {
    return priceStr;
  }
  
  // Se é um número, formata como USD
  const num = parseFloat(priceStr);
  if (!isNaN(num)) {
    return formatUsdPrice(num);
  }
  
  return priceStr;
}
