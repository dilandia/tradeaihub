"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { PlanInfo } from "@/lib/plan";

type PlanContextValue = {
  planInfo: PlanInfo | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
  /** Hydrate plan data from server — skips the initial client-side fetch */
  hydrate: (info: PlanInfo) => void;
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
  const res = await fetch("/api/plan", {
    credentials: "include",
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!res.ok) return null;
  return res.json();
}

type Props = { children: ReactNode };

export function PlanProvider({ children }: Props) {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Guard against concurrent fetches — only one in-flight at a time */
  const fetchInFlight = useRef(false);
  /** When true, a new fetch will be scheduled after the current one completes */
  const pendingRefetch = useRef(false);
  /** Track pending retry timeouts so we can cancel on unmount */
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** When hydrated from server, skip the initial client-side fetch */
  const hydratedRef = useRef(false);
  /** Track whether we've ever had valid plan data (to avoid re-showing skeleton) */
  const hadPlanData = useRef(false);

  /** Hydrate plan data from server — eliminates initial loading flash */
  const hydrate = useCallback((info: PlanInfo) => {
    hydratedRef.current = true;
    hadPlanData.current = true;
    setPlanInfo(info);
    setIsLoading(false);
  }, []);

  const refetch = useCallback(async () => {
    // If a fetch is already in progress, mark that we need another one after it
    if (fetchInFlight.current) {
      pendingRefetch.current = true;
      return;
    }
    fetchInFlight.current = true;
    // Only show loading skeleton if we never had plan data.
    // When refetching (e.g., after token refresh), keep showing current data.
    if (!hadPlanData.current) {
      setIsLoading(true);
    }
    let fetchedInfo: PlanInfo | null = null;
    try {
      fetchedInfo = await fetchPlan();
      if (fetchedInfo) hadPlanData.current = true;
      setPlanInfo(fetchedInfo);
    } finally {
      fetchInFlight.current = false;
      // If another refetch was requested while we were fetching, do it now
      if (pendingRefetch.current) {
        pendingRefetch.current = false;
        // Small delay to avoid hammering the API
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          refetch();
        }, 100);
        // Keep isLoading=true only if we don't have plan data yet
        // (if we already have valid plan data, show it while refetching)
        if (fetchedInfo) {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial fetch on mount — skip if already hydrated from server
  useEffect(() => {
    if (!hydratedRef.current) {
      refetch();
    }
  }, [refetch]);

  // Listen for auth state changes and refetch plan.
  // INITIAL_SESSION is critical: after a server-action login + redirect, the
  // browser Supabase client detects the session from cookies and fires
  // INITIAL_SESSION (not SIGNED_IN). Without handling it, plan data never
  // refreshes after login.
  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === "SIGNED_IN" ||
          event === "SIGNED_OUT" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED" ||
          event === "INITIAL_SESSION"
        ) {
          // Clear any pending retry from a previous event
          if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
          }

          if (event === "SIGNED_OUT" || (event === "INITIAL_SESSION" && !session)) {
            // No session — clear plan immediately
            setPlanInfo(null);
            setIsLoading(false);
            return;
          }

          // Session exists — fetch plan
          refetch();
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
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
    hydrate,
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
