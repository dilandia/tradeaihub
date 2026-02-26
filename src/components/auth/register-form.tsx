"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { signUpWithResult, resendConfirmationEmail } from "@/app/actions/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, type FieldState } from "@/components/ui/form-field";
import { ErrorAlert } from "@/components/ui/error-alert";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/contexts/language-context";

type Props = { message?: string; referralCode?: string };

export function RegisterForm({ message, referralCode }: Props) {
  const { t } = useLanguage();
  const formRef = useRef<HTMLFormElement>(null);
  const [nameState, setNameState] = useState<FieldState>("idle");
  const [emailState, setEmailState] = useState<FieldState>("idle");
  const [passwordState, setPasswordState] = useState<FieldState>("idle");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>("");

  // Resend confirmation states
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendCount, setResendCount] = useState(0);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Real-time name validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.currentTarget.value;
    if (!name) {
      setNameState("idle");
    } else if (name.length < 2) {
      setNameState("invalid");
    } else {
      setNameState("valid");
    }
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
      setPasswordError("");
    } else if (password.length < 6) {
      setPasswordState("invalid");
      setPasswordError(t("auth.passwordTooShort") || "Password must be at least 6 characters");
    } else {
      setPasswordState("valid");
      setPasswordError("");
    }
  };

  // Handle resend confirmation email
  const handleResend = async () => {
    if (!resendEmail || resendCount >= 2) return;

    setResendStatus("sending");
    try {
      await resendConfirmationEmail(resendEmail);
      setResendCount((prev) => prev + 1);
      setResendStatus("sent");
    } catch {
      setResendStatus("idle");
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setShowResend(false);
    setResendCount(0);
    setResendStatus("idle");
    setIsSubmitting(true);

    const formData = new FormData(formRef.current!);
    const name = formData.get("full_name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validate before submit
    if (name.length < 2) {
      setNameState("invalid");
      setIsSubmitting(false);
      return;
    }

    if (!validateEmail(email)) {
      setEmailState("invalid");
      setEmailError(t("auth.invalidEmail") || "Invalid email format");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setPasswordState("invalid");
      setPasswordError(t("auth.passwordTooShort") || "Password must be at least 6 characters");
      setIsSubmitting(false);
      return;
    }

    // Include referral code in form data if present
    if (referralCode) {
      formData.set("referral_code", referralCode);
    }

    try {
      const result = await signUpWithResult(formData);

      if (result.success) {
        // Redirect to login with success message
        window.location.href =
          "/login?message=" +
          encodeURIComponent(
            "Cadastro realizado! Confira seu email para confirmar a conta. Se não receber em alguns minutos, verifique a pasta de spam."
          );
        return;
      }

      // Handle "already registered" error with resend flow
      if (result.code === "EMAIL_ALREADY_REGISTERED") {
        setResendEmail(email);
        setShowResend(true);
        setIsSubmitting(false);
        return;
      }

      // Handle other errors
      setFormError(result.error);
      setIsSubmitting(false);
    } catch (error: unknown) {
      // Next.js redirect() throws internally — re-throw so the redirect completes
      const digest = (error as Record<string, unknown>)?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : "Registration failed. Please try again.";
      console.error("[RegisterForm] Signup error:", error);
      setFormError(errorMsg);
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
          <CardTitle className="text-2xl font-bold">{t("auth.registerTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("auth.registerSubtitle")}
          </p>
        </CardHeader>
        <CardContent>
          {referralCode && (
            <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-center text-sm text-green-700 dark:text-green-400">
              {t("referrals.referralApplied") || "Referral code applied! You'll get 10 bonus AI credits."}
            </div>
          )}
          {message && (
            <ErrorAlert
              severity="warning"
              title="Alert"
              message={message}
              className="mb-4"
            />
          )}
          {formError && !showResend && (
            <ErrorAlert
              severity="error"
              title="Registration Failed"
              message={formError}
              className="mb-4"
              onClose={() => setFormError("")}
            />
          )}

          {/* Resend confirmation email card */}
          {showResend && (
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="font-medium text-amber-800 dark:text-amber-300">
                {t("auth.emailAlreadyRegistered")}
              </p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                {t("auth.resendConfirmationHint")}
              </p>

              {resendStatus === "sent" && resendCount < 2 && (
                <div className="mt-3 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                  {t("auth.resendSuccess")}
                </div>
              )}

              {resendCount >= 2 && (
                <div className="mt-3 rounded-md border border-muted bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  {t("auth.resendLimitReached")}{" "}
                  <a
                    href="mailto:support@tradeaihub.com"
                    className="font-medium text-score underline underline-offset-2 hover:no-underline"
                  >
                    {t("auth.contactSupport")}
                  </a>{" "}
                  {t("auth.tryAnotherEmail")}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {resendCount < 2 && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendStatus === "sending"}
                    className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendStatus === "sending"
                      ? t("auth.resendSending")
                      : resendCount > 0
                        ? t("auth.resendAgain")
                        : t("auth.resendConfirmation")}
                  </button>
                )}
                <Link
                  href="/login"
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {t("auth.login")}
                </Link>
              </div>
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
            <FormField
              id="full_name"
              name="full_name"
              type="text"
              label={t("auth.fullName")}
              placeholder={t("auth.fullNamePlaceholder")}
              autoComplete="name"
              state={nameState}
              error={nameState === "invalid" ? "Name must be at least 2 characters" : ""}
              onChange={handleNameChange}
              disabled={isSubmitting}
            />
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
              label={t("auth.passwordMin")}
              placeholder="••••••••"
              autoComplete="new-password"
              state={passwordState}
              error={passwordError}
              onChange={handlePasswordChange}
              required
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || nameState !== "valid" || emailState !== "valid" || passwordState !== "valid"}
              className="mt-2 h-12 w-full rounded-lg bg-score px-4 py-3 font-medium text-white transition-colors hover:bg-score/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-score focus:ring-offset-2 focus:ring-offset-background"
            >
              {isSubmitting ? t("auth.registering") || "Registering..." : t("auth.register")}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <Link
              href="/login"
              className="font-medium text-score underline underline-offset-2 hover:no-underline transition-colors"
            >
              {t("auth.login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
