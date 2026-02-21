/**
 * TDR-10: Error boundary for dashboard routes
 */

"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Oops!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Algo deu errado no dashboard. Tente novamente ou entre em contato com o suporte.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6 font-mono break-all">
          {error.message}
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 dark:text-gray-600 mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          Tentar Novamente
        </button>
        <a
          href="/dashboard"
          className="block text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Voltar para Dashboard
        </a>
      </div>
    </div>
  );
}
