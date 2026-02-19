"use client";

import { useState, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { saveOnboardingResponse } from "@/app/actions/onboarding";

const STORAGE_KEY = "takez-onboarding-done";
const DATA_STORAGE_KEY = "takez-onboarding-data";

export type OnboardingData = {
  step: number;
  experienceLevel?: string;
  instruments?: string[];
  platform?: string;
};

const EXPERIENCE_OPTIONS = [
  { id: "beginner", labelKey: "onboarding.expBeginner", descKey: "onboarding.expBeginnerDesc" },
  { id: "intermediate", labelKey: "onboarding.expIntermediate", descKey: "onboarding.expIntermediateDesc" },
  { id: "advanced", labelKey: "onboarding.expAdvanced", descKey: "onboarding.expAdvancedDesc" },
  { id: "expert", labelKey: "onboarding.expExpert", descKey: "onboarding.expExpertDesc" },
];

const INSTRUMENT_OPTIONS = [
  { id: "forex", labelKey: "onboarding.instrumentForex" },
  { id: "stocks", labelKey: "onboarding.instrumentStocks" },
  { id: "crypto", labelKey: "onboarding.instrumentCrypto" },
  { id: "futures", labelKey: "onboarding.instrumentFutures" },
  { id: "options", labelKey: "onboarding.instrumentOptions" },
];

const PLATFORM_OPTIONS = [
  { id: "mt4", labelKey: "onboarding.platformMT4" },
  { id: "mt5", labelKey: "onboarding.platformMT5" },
  { id: "tradingview", labelKey: "onboarding.platformTradingView" },
  { id: "ctrader", labelKey: "onboarding.platformCTrader" },
  { id: "other", labelKey: "onboarding.platformOther" },
];

function loadDone(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

function saveDone() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {}
}

const LOADING_DURATION_MS = 3000; // 2–5 segundos (usando 3s)

export function OnboardingModal() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({ step: 1 });
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    setOpen(!loadDone());
  }, []);

  const persistData = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, [data]);

  const handleClose = useCallback(() => {
    persistData();
    saveDone();
    setOpen(false);
  }, [persistData]);

  const handleSkip = useCallback(() => {
    persistData();
    saveDone();
    setOpen(false);
  }, [persistData]);

  const handleNext = useCallback(() => {
    if (step < 4) {
      setStep((s) => s + 1);
      setData((d) => ({ ...d, step: step + 1 }));
    } else {
      persistData();
      saveDone();
      setOpen(false);
    }
  }, [step, persistData]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  const handleGetStarted = useCallback(async () => {
    setIsFinishing(true);
    persistData();

    await saveOnboardingResponse({
      experienceLevel: data.experienceLevel,
      instruments: data.instruments,
      platform: data.platform,
    });

    setTimeout(() => {
      saveDone();
      setOpen(false);
      setIsFinishing(false);
    }, LOADING_DURATION_MS);
  }, [persistData, data.experienceLevel, data.instruments, data.platform]);

  if (!open) return null;

  const totalSteps = 4;

  if (isFinishing) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="relative mx-4 w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-2xl">
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-score" />
            <p className="text-center text-lg font-medium text-foreground">
              {t("onboarding.personalizing")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {/* Progress */}
        <div className="mb-6 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-score transition-all"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {step}/{totalSteps}
          </span>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={t("common.close")}
        >
          <X className="h-5 w-5" />
        </button>

        {step === 1 && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-score/20">
                <Sparkles className="h-7 w-7 text-score" />
              </div>
            </div>
            <h2 className="mb-2 text-center text-xl font-bold text-foreground">
              {t("onboarding.welcome")}
            </h2>
            <p className="mb-8 text-center text-sm text-muted-foreground">
              {t("onboarding.welcomeDesc")}
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="mb-2 text-xl font-bold text-foreground">
              {t("onboarding.experienceTitle")}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {t("onboarding.experienceDesc")}
            </p>
            <div className="space-y-2">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setData((d) => ({ ...d, experienceLevel: opt.id }))}
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-left transition-colors",
                    data.experienceLevel === opt.id
                      ? "border-score bg-score/10 text-foreground"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-score/50"
                  )}
                >
                  <span className="font-medium">{t(opt.labelKey)}</span>
                  <p className="mt-0.5 text-xs opacity-80">{t(opt.descKey)}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="mb-2 text-xl font-bold text-foreground">
              {t("onboarding.instrumentsTitle")}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {t("onboarding.instrumentsDesc")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {INSTRUMENT_OPTIONS.map((opt) => {
                const selected = data.instruments?.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setData((d) => {
                        const list = d.instruments ?? [];
                        const next = selected
                          ? list.filter((x) => x !== opt.id)
                          : [...list, opt.id];
                        return { ...d, instruments: next };
                      });
                    }}
                    className={cn(
                      "rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                      selected
                        ? "border-score bg-score/10 text-foreground"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-score/50"
                    )}
                  >
                    {t(opt.labelKey)}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="mb-2 text-xl font-bold text-foreground">
              {t("onboarding.platformTitle")}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {t("onboarding.platformDesc")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORM_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setData((d) => ({ ...d, platform: opt.id }))}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                    data.platform === opt.id
                      ? "border-score bg-score/10 text-foreground"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-score/50"
                  )}
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className={cn(
              "flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground",
              step === 1 && "invisible"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            {t("common.back")}
          </button>

          <button
            type="button"
            onClick={step === 4 ? handleGetStarted : handleNext}
            className="flex items-center gap-1 rounded-lg bg-score px-4 py-2 text-sm font-semibold text-white hover:bg-score/90"
          >
            {step === 4 ? t("onboarding.getStarted") : t("common.next")}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="mt-4 block w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {t("onboarding.skipForNow")}
        </button>
      </div>
    </div>
  );
}
