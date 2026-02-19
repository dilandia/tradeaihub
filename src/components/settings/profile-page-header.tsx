"use client";

import { useLanguage } from "@/contexts/language-context";

export function ProfilePageHeader() {
  const { t } = useLanguage();
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-foreground">{t("settings.profile")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("profile.manageInfo")}
      </p>
    </div>
  );
}
