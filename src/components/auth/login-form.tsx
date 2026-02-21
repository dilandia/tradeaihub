"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { signIn } from "@/app/actions/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, type FieldState } from "@/components/ui/form-field";
import { ErrorAlert } from "@/components/ui/error-alert";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/contexts/language-context";

type Props = { message?: string };

export function LoginForm({ message }: Props) {
  const { t } = useLanguage();
  const formRef = useRef<HTMLFormElement>(null);
  const [emailState, setEmailState] = useState<FieldState>("idle");
  const [passwordState, setPasswordState] = useState<FieldState>("idle");
  const [emailError, setEmailError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>("");

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Real-time email validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.currentTarget.value;
    if (!email) {
      setEmailState("idle");
      setEmailError("");
    } else if (!validateEmail(email)) {
      setEmailState("invalid");
      setEmailError(t("auth.invalidEmail") || "Invalid email format");
    } else {
      setEmailState("valid");
      setEmailError("");
    }
  };

  // Real-time password validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.currentTarget.value;
    if (!password) {
      setPasswordState("idle");
    } else if (password.length < 6) {
      setPasswordState("invalid");
    } else {
      setPasswordState("valid");
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    const formData = new FormData(formRef.current!);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validate before submit
    if (!validateEmail(email)) {
      setEmailState("invalid");
      setEmailError(t("auth.invalidEmail") || "Invalid email format");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setPasswordState("invalid");
      setIsSubmitting(false);
      return;
    }

    try {
      await signIn(formData);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Login failed. Please try again.");
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
          <CardTitle className="text-2xl font-bold">{t("common.appName")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("auth.loginSubtitle")}
          </p>
        </CardHeader>
        <CardContent>
          {message && (
            <ErrorAlert
              severity="info"
              title="Info"
              message={message}
              className="mb-4"
            />
          )}
          {formError && (
            <ErrorAlert
              severity="error"
              title="Login Failed"
              message={formError}
              className="mb-4"
              onClose={() => setFormError("")}
            />
          )}
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
            <FormField
              id="email"
              name="email"
              type="email"
              label={t("auth.email")}
              placeholder={t("auth.emailPlaceholder")}
              autoComplete="email"
              state={emailState}
              error={emailError}
              onChange={handleEmailChange}
              required
              disabled={isSubmitting}
            />
            <FormField
              id="password"
              name="password"
              type="password"
              label={t("auth.password")}
              placeholder="••••••••"
              autoComplete="current-password"
              state={passwordState}
              error={passwordState === "invalid" ? t("auth.passwordTooShort") || "Password must be at least 6 characters" : ""}
              onChange={handlePasswordChange}
              required
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || emailState !== "valid" || passwordState !== "valid"}
              className="mt-2 h-12 w-full rounded-lg bg-score px-4 py-3 font-medium text-white transition-colors hover:bg-score/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-score focus:ring-offset-2 focus:ring-offset-background"
            >
              {isSubmitting ? t("auth.signingIn") || "Signing in..." : t("auth.login")}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link
              href="/register"
              className="font-medium text-score underline underline-offset-2 hover:no-underline transition-colors"
            >
              {t("auth.signUp")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
