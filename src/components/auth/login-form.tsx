"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, type FieldState } from "@/components/ui/form-field";
import { ErrorAlert } from "@/components/ui/error-alert";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/contexts/language-context";

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("email rate limit exceeded") || lower.includes("rate_limit")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (lower.includes("email not confirmed") || lower.includes("email_not_confirmed")) {
    return "Please confirm your email first. Check your inbox for the confirmation link.";
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
    return "Invalid email or password. Please try again.";
  }
  return message;
}

type Props = { message?: string };

export function LoginForm({ message }: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [emailState, setEmailState] = useState<FieldState>("idle");
  const [passwordState, setPasswordState] = useState<FieldState>("idle");
  const [emailError, setEmailError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    const formData = new FormData(formRef.current!);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

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

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setFormError(friendlyAuthError(error.message));
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
              severity={message.toLowerCase().includes("confirm") || message.toLowerCase().includes("confira") || message.toLowerCase().includes("updated successfully") || message.toLowerCase().includes("password updated") ? "info" : "warning"}
              title={message.toLowerCase().includes("confirm") || message.toLowerCase().includes("confira") || message.toLowerCase().includes("updated") ? "Info" : "Alert"}
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
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-score transition-colors"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>
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
