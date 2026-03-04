"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[Reports] Client error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium text-foreground">
          Ocorreu um erro ao carregar o relatório.
        </p>
        <p className="text-xs text-muted-foreground">
          {error.digest ? `Ref: ${error.digest}` : "Tente novamente."}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Voltar ao Dashboard
        </button>
      </div>
    </div>
  );
}
