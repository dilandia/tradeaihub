'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Auth Error Boundary]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <AlertTriangle className="w-16 h-16 text-red-500" />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Erro na Autenticação
          </h2>
          <p className="text-gray-600 mb-6">
            {error.message || 'Um erro inesperado ocorreu durante a autenticação. Tente novamente.'}
          </p>

          <div className="flex gap-3 justify-center flex-col sm:flex-row">
            <button
              onClick={() => reset()}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <RotateCcw className="w-4 h-4" /> Tentar novamente
            </button>
            <a
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              <Home className="w-4 h-4" /> Home
            </a>
          </div>
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && error.stack && (
        <details className="mt-8 w-full max-w-2xl">
          <summary className="cursor-pointer text-gray-600 font-semibold text-sm bg-white p-4 rounded-lg shadow">
            📋 Detalhes técnicos (desenvolvimento)
          </summary>
          <pre className="mt-4 p-4 bg-gray-900 text-gray-100 rounded text-xs overflow-auto max-h-64">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}
