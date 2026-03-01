'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home, RefreshCw } from 'lucide-react';
import { isStaleDeploymentError, attemptAutoRecovery, forceHardRefresh } from '@/lib/deployment-recovery';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Root Error Boundary]', error);
    if (isStaleDeploymentError(error.message || '')) {
      attemptAutoRecovery();
      return;
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4 bg-gray-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
            <div className="flex justify-center mb-6">
              <AlertTriangle className="w-16 h-16 text-red-500" />
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Oops!
              </h1>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Algo deu muito errado
              </h2>
              <p className="text-gray-600 mb-8">
                {error.message || 'Um erro crítico ocorreu na aplicação. Tente recarregar a página.'}
              </p>

              <div className="flex gap-3 justify-center flex-col sm:flex-row">
                <button
                  onClick={() => reset()}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <RotateCcw className="w-4 h-4" /> Recarregar
                </button>
                <a
                  href="/"
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  <Home className="w-4 h-4" /> Início
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

          <p className="text-gray-500 text-sm text-center mt-4">
            Se o problema persistir, clique em &quot;Forçar Atualização&quot; ou contate o suporte.
          </p>
          <button
            onClick={forceHardRefresh}
            className="mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm mx-auto"
          >
            <RefreshCw className="w-3 h-3" /> Forçar Atualização
          </button>
        </div>
      </body>
    </html>
  );
}
