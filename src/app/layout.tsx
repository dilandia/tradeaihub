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
import { PostHogProvider } from "@/providers/posthog-provider";
import { PostHogPageView } from "@/providers/posthog-pageview";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tradeaihub.com"),
  title: {
    default: "Trade AI Hub — AI-Powered Trading Journal",
    template: "%s | Trade AI Hub",
  },
  description:
    "The AI-powered trading journal that helps forex traders track, analyze, and improve their performance. Free tier available. Insights, pattern detection, and risk analysis powered by AI.",
  keywords: [
    "trading journal",
    "forex journal",
    "AI trading",
    "trade analysis",
    "trading metrics",
    "forex analytics",
    "trading diary",
    "trade tracker",
    "TakeZ Score",
    "trading performance",
  ],
  authors: [{ name: "Trade AI Hub" }],
  creator: "Trade AI Hub",
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "pt_BR",
    url: "https://tradeaihub.com",
    siteName: "Trade AI Hub",
    title: "Trade AI Hub — AI-Powered Trading Journal",
    description:
      "Track, analyze, and improve your trading with AI-powered insights. Free tier available.",
    // TODO: Replace /og-image.png with actual PNG (1200x630). SVG placeholder at public/og-image.svg
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Trade AI Hub Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trade AI Hub — AI-Powered Trading Journal",
    description:
      "Track, analyze, and improve your trading with AI-powered insights.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://tradeaihub.com",
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Trade AI Hub",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              description:
                "AI-powered trading journal for forex traders",
              url: "https://tradeaihub.com",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                description: "Free tier available",
              },
            }),
          }}
        />
        <Script
          src="https://cdn.lordicon.com/lordicon.js"
          strategy="lazyOnload"
        />
        <PostHogProvider>
          <PostHogPageView />
          <ThemeProvider>
            <LanguageProvider initialLocale={initialLocale}>
              <PlanProvider>
                <div className="min-h-screen bg-background">{children}</div>
                <ThemedToaster />
              </PlanProvider>
            </LanguageProvider>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
