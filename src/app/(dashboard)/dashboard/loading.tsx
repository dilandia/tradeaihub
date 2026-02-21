/**
 * TDW3-05: Loading skeleton for dashboard main page
 * Shows widget grid skeleton while dashboard data loads
 */

export default function DashboardPageLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-4 md:p-8">
      <div className="space-y-6">
        {/* Page header skeleton */}
        <div>
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-2" />
          <div className="h-6 w-96 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>

        {/* Widget controls skeleton */}
        <div className="flex gap-4">
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>

        {/* Draggable widget grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
          {[...Array(12)].map((_, i) => (
            <div
              key={`widget-${i}`}
              className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
