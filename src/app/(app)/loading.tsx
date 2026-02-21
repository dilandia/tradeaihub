/**
 * TDR-10: Loading state for app routes
 */

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400"></div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Carregando...</p>
      </div>
    </div>
  );
}
