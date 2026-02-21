"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { signUp } from "@/app/actions/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, type FieldState } from "@/components/ui/form-field";
import { ErrorAlert } from "@/components/ui/error-alert";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/contexts/language-context";

type Props = { message?: string };

export function RegisterForm({ message }: Props) {
  const { t } = useLanguage();
  const formRef = useRef<HTMLFormElement>(null);
  const [nameState, setNameState] = useState<FieldState>("idle");
  const [emailState, setEmailState] = useState<FieldState>("idle");
  const [passwordState, setPasswordState] = useState<FieldState>("idle");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>("");

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

  // Form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
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

    try {
      await signUp(formData);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Registration failed. Please try again.");
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
              title="Registration Failed"
              message={formError}
              className="mb-4"
              onClose={() => setFormError("")}
            />
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
