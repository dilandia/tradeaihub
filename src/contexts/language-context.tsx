"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  LOCALES,
  DEFAULT_LOCALE,
  COOKIE_LOCALE,
  type Locale,
} from "@/lib/i18n/config";
import { t } from "@/lib/i18n/translations";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getStoredLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const stored = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_LOCALE}=`))
    ?.split("=")[1];
  if (stored && LOCALES.includes(stored as Locale)) return stored as Locale;
  return DEFAULT_LOCALE;
}

function setStoredLocale(locale: Locale) {
  document.cookie = `${COOKIE_LOCALE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

type Props = { children: ReactNode; initialLocale?: Locale };

export function LanguageProvider({ children, initialLocale: initial }: Props) {
  const [locale, setLocaleState] = useState<Locale>(initial ?? getStoredLocale());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!initial) setLocaleState(getStoredLocale());
    setMounted(true);
  }, [initial]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale;
    }
  }, []);

  useEffect(() => {
    if (mounted && typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [mounted, locale]);

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      t(locale, key, params),
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
