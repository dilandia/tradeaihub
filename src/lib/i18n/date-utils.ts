import type { Locale } from "@/lib/i18n/config";

const INTL_LOCALE: Record<Locale, string> = {
  "pt-BR": "pt-BR",
  en: "en-US",
};

export function getIntlLocale(locale: Locale): string {
  return INTL_LOCALE[locale] ?? "en-US";
}

export function formatDate(
  date: Date | string,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const d =
    typeof date === "string"
      ? date.includes("T")
        ? new Date(date)
        : new Date(date + "T12:00:00")
      : date;
  const intlLocale = getIntlLocale(locale);
  return d.toLocaleDateString(intlLocale, options ?? {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function formatDateShort(date: Date | string, locale: Locale): string {
  return formatDate(date, locale, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string, locale: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const intlLocale = getIntlLocale(locale);
  return d.toLocaleString(intlLocale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getMonthNames(locale: Locale): string[] {
  const intlLocale = getIntlLocale(locale);
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2000, i, 1);
    return d.toLocaleDateString(intlLocale, { month: "long" });
  });
}

export function getMonthNameShort(locale: Locale, monthIndex: number): string {
  const intlLocale = getIntlLocale(locale);
  const d = new Date(2000, monthIndex, 1);
  return d.toLocaleDateString(intlLocale, { month: "short" });
}

export function getMonthNamesShort(locale: Locale): string[] {
  return Array.from({ length: 12 }, (_, i) => getMonthNameShort(locale, i));
}

export function getWeekdayNames(locale: Locale, format: "short" | "narrow" = "short"): string[] {
  const intlLocale = getIntlLocale(locale);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 7 + i); // Sun=7, Mon=8, ...
    return d.toLocaleDateString(intlLocale, { weekday: format });
  });
}
