"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

const STORAGE_KEY = "cookie-consent";

export function CookieConsent() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  function handleReject() {
    localStorage.setItem(STORAGE_KEY, "rejected");
    setVisible(false);
    // Opt out of PostHog tracking
    try {
      const posthog = (window as Window & { posthog?: { opt_out_capturing: () => void } }).posthog;
      if (posthog?.opt_out_capturing) {
        posthog.opt_out_capturing();
      }
    } catch {
      // PostHog not available — safe to ignore
    }
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[9999] transition-all duration-500 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto max-w-4xl px-4 pb-4">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/95 px-5 py-4 shadow-2xl backdrop-blur-sm sm:flex-row sm:justify-between">
          <p className="text-sm text-zinc-300">
            {t("cookies.message")}{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 transition-colors hover:text-white"
            >
              {t("cookies.learnMore")}
            </Link>
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={handleReject}
              className="rounded-lg border border-white/10 px-4 py-1.5 text-sm text-zinc-400 transition-colors hover:border-white/20 hover:text-zinc-200"
            >
              {t("cookies.reject")}
            </button>
            <button
              onClick={handleAccept}
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
            >
              {t("cookies.accept")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
