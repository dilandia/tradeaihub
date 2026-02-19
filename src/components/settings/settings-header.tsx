"use client";

import { useLanguage } from "@/contexts/language-context";

export function SettingsHeader() {
  const { t } = useLanguage();
  return (
    <h1 className="text-base font-semibold text-foreground">{t("settings.title")}</h1>
  );
}
