import type { Locale } from "./config";
import ptBR from "./locales/pt-BR.json";
import en from "./locales/en.json";

const translations: Record<Locale, Record<string, unknown>> = {
  "pt-BR": ptBR as Record<string, unknown>,
  en: en as Record<string, unknown>,
};

export function getTranslations(locale: Locale): Record<string, unknown> {
  return translations[locale] ?? translations["pt-BR"];
}

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

export function t(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = getTranslations(locale);
  let value = getNested(dict as Record<string, unknown>, key) ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return value;
}
