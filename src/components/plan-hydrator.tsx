"use client";

import { useLayoutEffect, useRef } from "react";
import { usePlan } from "@/contexts/plan-context";
import type { PlanInfo } from "@/lib/plan";

type Props = {
  planInfo: PlanInfo;
};

/**
 * Hydrates PlanContext with server-fetched plan data on mount.
 * Renders nothing — purely a side-effect component.
 * Uses useLayoutEffect to run BEFORE the PlanProvider's useEffect
 * (which would otherwise trigger an unnecessary client-side fetch).
 * This eliminates the "Free" flash by providing plan data immediately.
 */
export function PlanHydrator({ planInfo }: Props) {
  const { hydrate } = usePlan();
  const didHydrate = useRef(false);

  // useLayoutEffect runs synchronously before useEffect,
  // ensuring hydration happens before PlanProvider's initial fetch
  useLayoutEffect(() => {
    if (!didHydrate.current) {
      didHydrate.current = true;
      hydrate(planInfo);
    }
  }, [hydrate, planInfo]);

  return null;
}
