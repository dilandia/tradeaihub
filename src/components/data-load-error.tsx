"use client";

import { ErrorAlert, type ErrorSeverity } from "@/components/ui/error-alert";

interface DataLoadErrorProps {
  title?: string;
  message?: string;
  code?: string;
  severity?: ErrorSeverity;
  onRetry?: () => void;
  details?: string;
}

/**
 * Data Loading Error Component
 * Generic error display with retry capability
 * Used across dashboard and reports
 */
export function DataLoadError({
  title = "Failed to load data",
  message = "An error occurred while loading. Please check your connection and try again.",
  code,
  severity = "error",
  onRetry,
  details,
}: DataLoadErrorProps) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ErrorAlert
          severity={severity}
          title={title}
          message={message}
          code={code}
          details={details}
          action={
            onRetry
              ? {
                  label: "Retry",
                  handler: onRetry,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
