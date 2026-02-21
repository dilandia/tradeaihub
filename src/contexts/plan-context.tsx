"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { PlanInfo } from "@/lib/plan";

type PlanContextValue = {
  planInfo: PlanInfo | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
  canUseMetaApi: () => boolean;
  canAddMetaApiAccount: (currentCount: number) => boolean;
  canAddManualAccount: (currentCount: number) => boolean;
  canImport: (importsThisMonth: number) => boolean;
  canUseAi: () => boolean;
  canUseAiCopilot: () => boolean;
  canConsumeAiCredits: (amount?: number) => boolean;
  canExportPdf: () => boolean;
  canAccessReports: () => boolean;
  hasApiAccess: () => boolean;
};

const PlanContext = createContext<PlanContextValue | null>(null);

async function fetchPlan(): Promise<PlanInfo | null> {
  const res = await fetch("/api/plan", { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

type Props = { children: ReactNode };

export function PlanProvider({ children }: Props) {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const info = await fetchPlan();
      setPlanInfo(info);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Listen for auth state changes and refetch plan when auth changes
  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        // Refetch plan when user signs in, signs out, or session changes
        // Add small delay to ensure session is fully synchronized between client and server
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          // Wait 500ms for session to sync, then refetch
          setTimeout(() => {
            refetch();
          }, 500);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [refetch]);

  const canUseMetaApi = useCallback(
    () => planInfo?.canUseMetaApi ?? false,
    [planInfo]
  );

  const canAddMetaApiAccount = useCallback(
    (currentCount: number) =>
      (planInfo?.canUseMetaApi ?? false) &&
      currentCount < (planInfo?.maxActiveMetaApiAccounts ?? 0),
    [planInfo]
  );

  const canAddManualAccount = useCallback(
    (currentCount: number) =>
      currentCount < (planInfo?.maxManualAccounts ?? 0),
    [planInfo]
  );

  const canImport = useCallback(
    (importsThisMonth: number) =>
      importsThisMonth < (planInfo?.importLimitPerMonth ?? 0),
    [planInfo]
  );

  const canUseAi = useCallback(
    () => planInfo?.canUseAi ?? false,
    [planInfo]
  );

  const canUseAiCopilot = useCallback(
    () => planInfo?.canUseAiCopilot ?? false,
    [planInfo]
  );

  const canConsumeAiCredits = useCallback(
    (amount = 1) =>
      (planInfo?.canUseAi ?? false) &&
      (planInfo?.aiCreditsRemaining ?? 0) >= amount,
    [planInfo]
  );

  const canExportPdf = useCallback(
    () => planInfo?.canExportPdf ?? false,
    [planInfo]
  );

  const canAccessReports = useCallback(
    () => planInfo?.canAccessReports ?? false,
    [planInfo]
  );

  const hasApiAccess = useCallback(
    () => planInfo?.hasApiAccess ?? false,
    [planInfo]
  );

  const value: PlanContextValue = {
    planInfo,
    isLoading,
    refetch,
    canUseMetaApi,
    canAddMetaApiAccount,
    canAddManualAccount,
    canImport,
    canUseAi,
    canUseAiCopilot,
    canConsumeAiCredits,
    canExportPdf,
    canAccessReports,
    hasApiAccess,
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    throw new Error("usePlan must be used within PlanProvider");
  }
  return ctx;
}
