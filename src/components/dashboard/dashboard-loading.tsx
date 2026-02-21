"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard Loading State
 * Shows skeleton screens while dashboard data is loading
 * Provides progressive loading feedback (metrics → charts → tables)
 */
export function DashboardLoading() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Sticky toolbar skeleton */}
      <div className="sticky top-14 z-20 h-12 bg-background/95 rounded-lg">
        <Skeleton height="h-10" width="full" />
      </div>

      {/* KPI Row - Responsive skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
        <Skeleton height="h-32" rounded count={4} />
      </div>

      {/* Main Content Grid - Progressive loading */}
      <div className="space-y-6">
        {/* Charts Section (3 columns on desktop, responsive mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
          <Skeleton height="h-80" rounded count={3} />
        </div>

        {/* Calendar + Table Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
          <Skeleton height="h-96" rounded />
          <Skeleton height="h-96" rounded />
        </div>

        {/* Additional Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
          <Skeleton height="h-80" rounded count={3} />
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="border border-border rounded-lg p-4">
        <Skeleton height="h-20" rounded className="mb-4" />
        <Skeleton height="h-4" width="w-3/4" rounded />
      </div>
    </div>
  );
}
