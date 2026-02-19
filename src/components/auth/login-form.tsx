"use client";

import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/contexts/language-context";

type Props = { message?: string };

export function LoginForm({ message }: Props) {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
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
            <p className="mb-4 rounded-lg bg-score/10 p-3 text-sm text-score">
              {message}
            </p>
          )}
          <form action={signIn} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                {t("auth.email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={t("auth.emailPlaceholder")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-score"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                {t("auth.password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-score"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-score py-2.5 font-medium text-white transition-colors hover:bg-score/90 focus:outline-none focus:ring-2 focus:ring-score focus:ring-offset-2 focus:ring-offset-background"
            >
              {t("auth.login")}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link
              href="/register"
              className="font-medium text-score underline underline-offset-2 hover:no-underline"
            >
              {t("auth.signUp")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
