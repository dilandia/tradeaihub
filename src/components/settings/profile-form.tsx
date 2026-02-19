"use client";

import { useState, useTransition } from "react";
import { useLanguage } from "@/contexts/language-context";
import { formatDate } from "@/lib/i18n/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  Mail,
  Phone,
  Globe,
  DollarSign,
  Languages,
  Clock,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Camera,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  updateProfile,
  deleteAvatar,
  type ProfileData,
  type ProfileUpdatePayload,
} from "@/app/actions/profile";

/* ─── Constants ─── */

const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "Brasília (UTC-3)" },
  { value: "America/New_York", label: "New York (UTC-5)" },
  { value: "America/Chicago", label: "Chicago (UTC-6)" },
  { value: "America/Denver", label: "Denver (UTC-7)" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-8)" },
  { value: "Europe/London", label: "London (UTC+0)" },
  { value: "Europe/Berlin", label: "Berlin (UTC+1)" },
  { value: "Europe/Moscow", label: "Moscow (UTC+3)" },
  { value: "Asia/Dubai", label: "Dubai (UTC+4)" },
  { value: "Asia/Singapore", label: "Singapore (UTC+8)" },
  { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
  { value: "Australia/Sydney", label: "Sydney (UTC+11)" },
];

const CURRENCIES = [
  { value: "USD", label: "USD — Dólar Americano" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — Libra Esterlina" },
  { value: "BRL", label: "BRL — Real Brasileiro" },
  { value: "JPY", label: "JPY — Iene Japonês" },
  { value: "AUD", label: "AUD — Dólar Australiano" },
  { value: "CAD", label: "CAD — Dólar Canadense" },
  { value: "CHF", label: "CHF — Franco Suíço" },
];

const LANGUAGES = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

/* ─── Field Component ─── */

function Field({
  label,
  icon: Icon,
  children,
  description,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </label>
      {children}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

type Props = { profile: ProfileData };

export function ProfileForm({ profile }: Props) {
  const { t, locale } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  /* Form state */
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [timezone, setTimezone] = useState(profile.timezone);
  const [currency, setCurrency] = useState(profile.preferred_currency);
  const [language, setLanguage] = useState(profile.language);

  const hasChanges =
    fullName !== (profile.full_name ?? "") ||
    phone !== (profile.phone ?? "") ||
    bio !== (profile.bio ?? "") ||
    timezone !== profile.timezone ||
    currency !== profile.preferred_currency ||
    language !== profile.language;

  function handleSave() {
    setStatus("idle");
    const payload: ProfileUpdatePayload = {
      full_name: fullName.trim(),
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
      timezone,
      preferred_currency: currency,
      language,
    };

    startTransition(async () => {
      const result = await updateProfile(payload);
      if (result.success) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setErrorMsg(result.error ?? t("profile.saveError"));
      }
    });
  }

  function handleDeleteAvatar() {
    startTransition(async () => {
      await deleteAvatar();
    });
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-score transition-colors";

  const selectClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-score transition-colors appearance-none cursor-pointer";

  return (
    <div className="space-y-6">
      {/* ─── Avatar Section ─── */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("profile.avatar")}
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-score/20 text-score">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold">
                    {(profile.full_name ?? profile.email)?.[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-score text-white hover:bg-score/90 transition-colors"
                title={t("profile.changePhoto")}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {profile.full_name || t("profile.noName")}
              </p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
                  title={t("profile.changePhoto")}
                >
                  {t("profile.uploadPhoto")}
                </button>
                {profile.avatar_url && (
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-loss hover:bg-loss/10 transition-colors"
                  >
                    <Trash2 className="mr-1 inline h-3 w-3" />
                    {t("profile.remove")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Personal Information ─── */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("profile.personalInfo")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("profile.fullName")} icon={User}>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("profile.fullNamePlaceholder")}
                className={inputClass}
              />
            </Field>

            <Field
              label={t("profile.email")}
              icon={Mail}
              description={t("profile.emailCannotChange")}
            >
              <input
                type="email"
                value={profile.email}
                disabled
                className={cn(inputClass, "cursor-not-allowed opacity-60")}
              />
            </Field>

            <Field label={t("profile.phone")} icon={Phone} description={t("profile.optional")}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("profile.phonePlaceholder")}
                className={inputClass}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field
                label={t("profile.bio")}
                icon={User}
                description={t("profile.bioDesc")}
              >
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 200))}
                  placeholder={t("profile.bioPlaceholder")}
                  rows={3}
                  className={cn(inputClass, "resize-none")}
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {bio.length}/200
                </p>
              </Field>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Preferences ─── */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("profile.preferences")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label={t("profile.timezone")}
              icon={Clock}
              description={t("profile.timezoneDesc")}
            >
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={selectClass}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label={t("profile.currency")}
              icon={DollarSign}
              description={t("profile.currencyDesc")}
            >
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={selectClass}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label={t("profile.language")}
              icon={Languages}
              description={t("profile.languageDesc")}
            >
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={selectClass}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ─── Account Info (read-only) ─── */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("profile.accountInfo")}
          </h3>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex justify-between rounded-lg bg-muted/30 px-4 py-3">
              <span className="text-muted-foreground">{t("profile.accountId")}</span>
              <span className="font-mono text-xs text-foreground">
                {profile.id.slice(0, 8)}...
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-muted/30 px-4 py-3">
              <span className="text-muted-foreground">{t("profile.memberSince")}</span>
              <span className="text-foreground">
                {formatDate(profile.created_at, locale, {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-muted/30 px-4 py-3">
              <span className="text-muted-foreground">{t("profile.lastUpdate")}</span>
              <span className="text-foreground">
                {formatDate(profile.updated_at, locale, {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-muted/30 px-4 py-3">
              <span className="text-muted-foreground">{t("profile.plan")}</span>
              <span className="font-medium text-score">{t("profile.free")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Save Button ─── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isPending}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-all",
            hasChanges && !isPending
              ? "bg-score hover:bg-score/90 shadow-sm"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isPending ? t("profile.saving") : t("profile.saveChanges")}
        </button>

        {status === "success" && (
          <span className="inline-flex items-center gap-1.5 text-sm text-profit">
            <CheckCircle className="h-4 w-4" />
            {t("profile.profileUpdated")}
          </span>
        )}
        {status === "error" && (
          <span className="inline-flex items-center gap-1.5 text-sm text-loss">
            <AlertCircle className="h-4 w-4" />
            {errorMsg}
          </span>
        )}
      </div>
    </div>
  );
}
