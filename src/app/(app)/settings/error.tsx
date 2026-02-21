/**
 * TDR-10: Error boundary for settings routes
 */

"use client";

import { useEffect } from "react";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Settings error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Erro nas Configurações
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Não foi possível carregar esta página. Tente novamente.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6 font-mono break-all">
            {error.message}
          </p>
          <button
            onClick={reset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    </div>
  );
}
