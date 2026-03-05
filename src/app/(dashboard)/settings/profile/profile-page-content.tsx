"use client";

import { useEffect, useState } from "react";
import { getProfile, type ProfileData } from "@/app/actions/profile";
import { ProfileForm } from "@/components/settings/profile-form";
import { ProfilePageHeader } from "@/components/settings/profile-page-header";
import { useLanguage } from "@/contexts/language-context";
import { Loader2 } from "lucide-react";

export function ProfilePageContent() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getProfile()
      .then((data) => {
        if (!cancelled) {
          if (!data) {
            window.location.href = "/login";
            return;
          }
          setProfile(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[ProfilePage] Failed to load profile:", err);
          setError(t("profile.loadError") ?? "Erro ao carregar perfil. Tente novamente.");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [t]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <ProfilePageHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-3xl">
        <ProfilePageHeader />
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-sm text-loss">{error ?? "Erro ao carregar perfil."}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-score px-4 py-2 text-sm font-medium text-white hover:bg-score/90 transition-colors"
          >
            {t("common.tryAgain") ?? "Tentar Novamente"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ProfilePageHeader />
      <ProfileForm profile={profile} />
    </div>
  );
}
