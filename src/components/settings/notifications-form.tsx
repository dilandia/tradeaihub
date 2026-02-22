"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Mail,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";
import {
  updateNotificationPrefs,
  type NotificationPrefs,
} from "@/app/actions/notifications";

/* ─── Toggle ─── */

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3"
    >
      <div
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-score" : "bg-muted"
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </div>
      <span className="text-sm text-foreground">{label}</span>
    </button>
  );
}

/* ─── Radio Option ─── */

function RadioOption({
  value,
  selected,
  onChange,
  label,
  description,
  disabled,
}: {
  value: string;
  selected: boolean;
  onChange: (v: string) => void;
  label: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(value)}
      disabled={disabled}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
        selected && !disabled
          ? "border-score bg-score/5"
          : "border-border",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:border-muted-foreground/30"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected && !disabled
            ? "border-score"
            : "border-muted-foreground/40"
        )}
      >
        {selected && !disabled && (
          <div className="h-2 w-2 rounded-full bg-score" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

/* ─── Main Component ─── */

type Props = { initialPrefs: NotificationPrefs };

export function NotificationsForm({ initialPrefs }: Props) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const [form, setForm] = useState<NotificationPrefs>({ ...initialPrefs });

  const hasChanges = JSON.stringify(form) !== JSON.stringify(initialPrefs);

  function handleSave() {
    setStatus("idle");
    startTransition(async () => {
      const result = await updateNotificationPrefs(form);
      if (result.success) {
        setStatus("success");
        toast.success(t("settings.notificationsSaved"));
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        toast.error(t("settings.notificationsSaveError"));
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* ─── Email Reports ─── */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("settings.emailReportsTitle")}
          </h3>
          <p className="mb-5 text-sm text-muted-foreground">
            {t("settings.emailReportsDesc")}
          </p>

          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Toggle
                checked={form.emailReportsEnabled}
                onChange={(v) =>
                  setForm((f) => ({ ...f, emailReportsEnabled: v }))
                }
                label={t("settings.emailReportsEnabled")}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {t("settings.emailReportsFrequency")}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <RadioOption
                  value="weekly"
                  selected={form.emailReportFrequency === "weekly"}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      emailReportFrequency: v as "weekly" | "monthly",
                    }))
                  }
                  label={t("settings.emailReportsWeekly")}
                  description={t("settings.emailReportsWeeklyDesc")}
                  disabled={!form.emailReportsEnabled}
                />
                <RadioOption
                  value="monthly"
                  selected={form.emailReportFrequency === "monthly"}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      emailReportFrequency: v as "weekly" | "monthly",
                    }))
                  }
                  label={t("settings.emailReportsMonthly")}
                  description={t("settings.emailReportsMonthlyDesc")}
                  disabled={!form.emailReportsEnabled}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Actions ─── */}
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
          {isPending ? t("common.loading") : t("common.save")}
        </button>

        {status === "success" && (
          <span className="inline-flex items-center gap-1.5 text-sm text-profit">
            <CheckCircle className="h-4 w-4" />
            {t("settings.notificationsSaved")}
          </span>
        )}
        {status === "error" && (
          <span className="inline-flex items-center gap-1.5 text-sm text-loss">
            <AlertCircle className="h-4 w-4" />
            {t("settings.notificationsSaveError")}
          </span>
        )}
      </div>
    </div>
  );
}
