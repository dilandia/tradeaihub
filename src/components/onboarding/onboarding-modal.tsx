"use client";

import { useState, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { saveOnboardingResponse, checkOnboardingCompleted } from "@/app/actions/onboarding";

const STORAGE_KEY = "takez-onboarding-done";

export type OnboardingData = {
  step: number;
  experienceLevel?: string;
  instruments?: string[];
  platform?: string;
};

const EXPERIENCE_OPTIONS = [
  { id: "beginner", labelKey: "onboarding.expBeginner", descKey: "onboarding.expBeginnerDesc", icon: "🌱" },
  { id: "intermediate", labelKey: "onboarding.expIntermediate", descKey: "onboarding.expIntermediateDesc", icon: "📊" },
  { id: "advanced", labelKey: "onboarding.expAdvanced", descKey: "onboarding.expAdvancedDesc", icon: "🎯" },
  { id: "expert", labelKey: "onboarding.expExpert", descKey: "onboarding.expExpertDesc", icon: "🏆" },
];

const INSTRUMENT_OPTIONS = [
  { id: "forex", labelKey: "onboarding.instrumentForex", icon: "💱" },
  { id: "stocks", labelKey: "onboarding.instrumentStocks", icon: "📈" },
  { id: "crypto", labelKey: "onboarding.instrumentCrypto", icon: "₿" },
  { id: "futures", labelKey: "onboarding.instrumentFutures", icon: "📋" },
  { id: "options", labelKey: "onboarding.instrumentOptions", icon: "⚡" },
];

const PLATFORM_OPTIONS = [
  { id: "mt4", labelKey: "onboarding.platformMT4", icon: "MT4" },
  { id: "mt5", labelKey: "onboarding.platformMT5", icon: "MT5" },
  { id: "tradingview", labelKey: "onboarding.platformTradingView", icon: "TV" },
  { id: "ctrader", labelKey: "onboarding.platformCTrader", icon: "cT" },
  { id: "other", labelKey: "onboarding.platformOther", icon: "..." },
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

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

export function OnboardingModal() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>({ step: 1 });
  const [isFinishing, setIsFinishing] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function check() {
      // Fast path: localStorage says done
      if (loadDone()) {
        setIsChecking(false);
        return;
      }
      // Slow path: check server (cross-device persistence)
      try {
        const completed = await checkOnboardingCompleted();
        if (completed) {
          saveDone(); // Sync localStorage
          setIsChecking(false);
          return;
        }
      } catch {
        // Server check failed, fall through to show modal
      }
      setOpen(true);
      setIsChecking(false);
    }
    check();
  }, []);

  const handleClose = useCallback(() => {
    saveDone();
    setOpen(false);
  }, []);

  const handleNext = useCallback(() => {
    if (step < 4) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleGetStarted = useCallback(async () => {
    setIsFinishing(true);

    await saveOnboardingResponse({
      experienceLevel: data.experienceLevel,
      instruments: data.instruments,
      platform: data.platform,
    });

    setTimeout(() => {
      saveDone();
      setOpen(false);
      setIsFinishing(false);
    }, 2000);
  }, [data.experienceLevel, data.instruments, data.platform]);

  if (isChecking || !open) return null;

  const totalSteps = 4;

  if (isFinishing) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mx-4 w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-2xl"
        >
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-score/20" />
              <Loader2 className="relative h-12 w-12 animate-spin text-score" />
            </div>
            <p className="text-center text-lg font-medium text-foreground">
              {t("onboarding.personalizing")}
            </p>
            <p className="text-center text-sm text-muted-foreground">
              {t("onboarding.personalizingDesc") || "Setting up your AI-powered trading journal..."}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative mx-4 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Gradient accent top */}
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500" />

        <div className="p-6">
          {/* Progress bar */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex flex-1 gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                    i < step ? "bg-score" : "bg-muted"
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {step}/{totalSteps}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-5 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Animated step content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {/* Step 1: Welcome */}
              {step === 1 && (
                <div className="text-center">
                  <div className="mb-5 flex justify-center">
                    <div className="relative">
                      <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 blur-lg" />
                      <Image
                        src="/icon-glyph-512x512.png"
                        alt="Trade AI Hub"
                        width={80}
                        height={80}
                        className="relative rounded-xl"
                      />
                    </div>
                  </div>
                  <h2 className="mb-2 text-2xl font-bold text-foreground">
                    {t("onboarding.welcome")}
                  </h2>
                  <p className="mb-2 text-sm text-muted-foreground">
                    {t("onboarding.welcomeDesc")}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {t("onboarding.welcomeSubtext") || "Answer a few quick questions so we can personalize your experience."}
                  </p>
                </div>
              )}

              {/* Step 2: Experience Level */}
              {step === 2 && (
                <>
                  <h2 className="mb-1 text-xl font-bold text-foreground">
                    {t("onboarding.experienceTitle")}
                  </h2>
                  <p className="mb-5 text-sm text-muted-foreground">
                    {t("onboarding.experienceDesc")}
                  </p>
                  <div className="space-y-2">
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setData((d) => ({ ...d, experienceLevel: opt.id }))}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200",
                          data.experienceLevel === opt.id
                            ? "border-score bg-score/10 text-foreground shadow-sm shadow-score/10"
                            : "border-border bg-muted/20 text-muted-foreground hover:border-score/40 hover:bg-muted/40"
                        )}
                      >
                        <span className="text-xl">{opt.icon}</span>
                        <div>
                          <span className="font-medium text-foreground">{t(opt.labelKey)}</span>
                          <p className="mt-0.5 text-xs opacity-70">{t(opt.descKey)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 3: Instruments */}
              {step === 3 && (
                <>
                  <h2 className="mb-1 text-xl font-bold text-foreground">
                    {t("onboarding.instrumentsTitle")}
                  </h2>
                  <p className="mb-5 text-sm text-muted-foreground">
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
                            "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200",
                            selected
                              ? "border-score bg-score/10 text-foreground shadow-sm shadow-score/10"
                              : "border-border bg-muted/20 text-muted-foreground hover:border-score/40 hover:bg-muted/40"
                          )}
                        >
                          <span>{opt.icon}</span>
                          {t(opt.labelKey)}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Step 4: Platform */}
              {step === 4 && (
                <>
                  <h2 className="mb-1 text-xl font-bold text-foreground">
                    {t("onboarding.platformTitle")}
                  </h2>
                  <p className="mb-5 text-sm text-muted-foreground">
                    {t("onboarding.platformDesc")}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PLATFORM_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setData((d) => ({ ...d, platform: opt.id }))}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200",
                          data.platform === opt.id
                            ? "border-score bg-score/10 text-foreground shadow-sm shadow-score/10"
                            : "border-border bg-muted/20 text-muted-foreground hover:border-score/40 hover:bg-muted/40"
                        )}
                      >
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                          {opt.icon}
                        </span>
                        {t(opt.labelKey)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className={cn(
                "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                step === 1 && "invisible"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              {t("common.back")}
            </button>

            <button
              type="button"
              onClick={step === 4 ? handleGetStarted : handleNext}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-xl hover:shadow-violet-500/30"
            >
              {step === 4 ? t("onboarding.getStarted") : t("common.next")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="mt-3 block w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {t("onboarding.skipForNow")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
