import type { Metadata } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedToaster } from "@/components/themed-toaster";
import { LanguageProvider } from "@/contexts/language-context";
import { PlanProvider } from "@/contexts/plan-context";
import { COOKIE_LOCALE, LOCALES, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TakeZ Plan – Journaling & Métricas Forex",
  description: "SaaS de journaling e análise de métricas para traders de forex",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const stored = cookieStore.get(COOKIE_LOCALE)?.value;
  const initialLocale = (stored && LOCALES.includes(stored as Locale)) ? stored as Locale : DEFAULT_LOCALE;

  return (
    <html lang={initialLocale} className="light" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Script
          src="https://cdn.lordicon.com/lordicon.js"
          strategy="lazyOnload"
        />
        <ThemeProvider>
          <LanguageProvider initialLocale={initialLocale}>
            <PlanProvider>
              <div className="min-h-screen bg-background">{children}</div>
              <ThemedToaster />
            </PlanProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
