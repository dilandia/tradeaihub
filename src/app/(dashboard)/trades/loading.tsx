/**
 * TDW3-05: Loading skeleton for trades page
 * Shows table skeleton while trade data loads
 */

export default function TradesLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-4 md:p-8">
      <div className="space-y-6">
        {/* Page header skeleton */}
        <div>
          <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-2" />
          <div className="h-6 w-80 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>

        {/* Filter controls skeleton */}
        <div className="flex flex-wrap gap-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={`filter-${i}`}
              className="h-10 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"
            />
          ))}
        </div>

        {/* Pagination info skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-6 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>

        {/* Table skeleton */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          {/* Table header skeleton */}
          <div className="h-14 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 animate-pulse" />

          {/* Table rows skeleton (10 rows) */}
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {[...Array(10)].map((_, i) => (
              <div
                key={`row-${i}`}
                className="h-16 bg-white dark:bg-gray-950 animate-pulse p-4 flex items-center gap-4"
              >
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded flex-1" />
                <div className="h-5 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Pagination controls skeleton */}
        <div className="flex justify-center gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={`page-${i}`}
              className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
