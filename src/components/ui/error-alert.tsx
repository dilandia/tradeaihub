"use client";

import { AlertCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";

type ErrorSeverity = "info" | "warning" | "error";

interface ErrorAlertProps {
  severity?: ErrorSeverity;
  title: string;
  message: string;
  code?: string;
  action?: {
    label: string;
    handler: () => void;
  };
  details?: string;
  onClose?: () => void;
  className?: string;
}

const ErrorAlert = React.forwardRef<HTMLDivElement, ErrorAlertProps>(
  ({
    severity = "error",
    title,
    message,
    code,
    action,
    details,
    onClose,
    className,
  }, ref) => {
    const severityStyles = {
      info: {
        bg: "bg-blue-50 dark:bg-blue-950",
        border: "border border-blue-200 dark:border-blue-800",
        icon: "text-blue-600 dark:text-blue-400",
        title: "text-blue-900 dark:text-blue-200",
        text: "text-blue-800 dark:text-blue-300",
      },
      warning: {
        bg: "bg-amber-50 dark:bg-amber-950",
        border: "border border-amber-200 dark:border-amber-800",
        icon: "text-amber-600 dark:text-amber-400",
        title: "text-amber-900 dark:text-amber-200",
        text: "text-amber-800 dark:text-amber-300",
      },
      error: {
        bg: "bg-red-50 dark:bg-red-950",
        border: "border-2 border-red-500 dark:border-red-600",
        icon: "text-red-600 dark:text-red-400",
        title: "text-red-900 dark:text-red-200",
        text: "text-red-800 dark:text-red-300",
      },
    };

    const style = severityStyles[severity];
    const IconComponent =
      severity === "error" ? XCircle : severity === "warning" ? AlertTriangle : Info;

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg p-4",
          style.bg,
          style.border,
          className
        )}
        role="alert"
      >
        <div className="flex gap-3">
          <div className="shrink-0 mt-0.5">
            <IconComponent className={cn("h-5 w-5", style.icon)} aria-hidden />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={cn("font-semibold", style.title)}>
                {title}
              </h3>
              {onClose && (
                <button
                  onClick={onClose}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close alert"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              )}
            </div>

            <p className={cn("text-sm mt-1", style.text)}>
              {message}
            </p>

            {code && (
              <p className="text-xs opacity-75 mt-2">
                Code: <code className="font-mono">{code}</code>
              </p>
            )}

            {details && (
              <p className="text-xs opacity-70 mt-2 font-mono bg-black/10 dark:bg-white/10 p-2 rounded">
                {details}
              </p>
            )}

            {action && (
              <button
                onClick={action.handler}
                className={cn(
                  "mt-4 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                  severity === "error" && "bg-red-600 hover:bg-red-700 text-white",
                  severity === "warning" && "bg-amber-600 hover:bg-amber-700 text-white",
                  severity === "info" && "bg-blue-600 hover:bg-blue-700 text-white"
                )}
              >
                {action.label}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ErrorAlert.displayName = "ErrorAlert";

export { ErrorAlert, type ErrorSeverity };
