"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { updatePassword } from "@/app/actions/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, type FieldState } from "@/components/ui/form-field";
import { ErrorAlert } from "@/components/ui/error-alert";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/contexts/language-context";

type Props = { message?: string };

export function ResetPasswordForm({ message }: Props) {
  const { t } = useLanguage();
  const formRef = useRef<HTMLFormElement>(null);
  const [passwordState, setPasswordState] = useState<FieldState>("idle");
  const [confirmState, setConfirmState] = useState<FieldState>("idle");
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmError, setConfirmError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>("");

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.currentTarget.value;
    if (!password) {
      setPasswordState("idle");
      setPasswordError("");
    } else if (password.length < 6) {
      setPasswordState("invalid");
      setPasswordError(t("auth.passwordTooShort") || "Password must be at least 6 characters");
    } else {
      setPasswordState("valid");
      setPasswordError("");
    }

    // Re-validate confirm field if it has a value
    const confirmInput = formRef.current?.querySelector<HTMLInputElement>('[name="confirmPassword"]');
    if (confirmInput?.value) {
      if (confirmInput.value !== password) {
        setConfirmState("invalid");
        setConfirmError(t("auth.passwordsDoNotMatch"));
      } else if (password.length >= 6) {
        setConfirmState("valid");
        setConfirmError("");
      }
    }
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const confirm = e.currentTarget.value;
    const passwordInput = formRef.current?.querySelector<HTMLInputElement>('[name="password"]');
    const password = passwordInput?.value || "";

    if (!confirm) {
      setConfirmState("idle");
      setConfirmError("");
    } else if (confirm !== password) {
      setConfirmState("invalid");
      setConfirmError(t("auth.passwordsDoNotMatch"));
    } else {
      setConfirmState("valid");
      setConfirmError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    const formData = new FormData(formRef.current!);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password.length < 6) {
      setPasswordState("invalid");
      setPasswordError(t("auth.passwordTooShort") || "Password must be at least 6 characters");
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmState("invalid");
      setConfirmError(t("auth.passwordsDoNotMatch"));
      setIsSubmitting(false);
      return;
    }

    try {
      await updatePassword(formData);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to update password.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 xs:p-3 sm:p-4">
      <div className="absolute right-4 top-4">
        <LanguageSelector />
      </div>
      <Card className="w-full max-w-md border-border bg-card p-6 shadow-card md:p-8">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {t("auth.resetPassword")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("auth.forgotPasswordSubtitle")}
          </p>
        </CardHeader>
        <CardContent>
          {message && (
            <ErrorAlert
              severity="warning"
              title="Alert"
              message={message}
              className="mb-4"
            />
          )}
          {formError && (
            <ErrorAlert
              severity="error"
              title="Error"
              message={formError}
              className="mb-4"
              onClose={() => setFormError("")}
            />
          )}
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
            <FormField
              id="password"
              name="password"
              type="password"
              label={t("auth.newPassword")}
              placeholder="••••••••"
              autoComplete="new-password"
              state={passwordState}
              error={passwordError}
              onChange={handlePasswordChange}
              required
              disabled={isSubmitting}
            />
            <FormField
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label={t("auth.confirmNewPassword")}
              placeholder="••••••••"
              autoComplete="new-password"
              state={confirmState}
              error={confirmError}
              onChange={handleConfirmChange}
              required
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || passwordState !== "valid" || confirmState !== "valid"}
              className="mt-2 h-12 w-full rounded-lg bg-score px-4 py-3 font-medium text-white transition-colors hover:bg-score/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-score focus:ring-offset-2 focus:ring-offset-background"
            >
              {isSubmitting ? t("common.loading") : t("auth.resetPassword")}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-score underline underline-offset-2 hover:no-underline transition-colors"
            >
              {t("auth.backToLogin")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
