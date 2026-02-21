"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import * as React from "react";

type FieldState = "idle" | "focused" | "validating" | "valid" | "invalid" | "error";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  state?: FieldState;
  helperText?: string;
  icon?: React.ReactNode;
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ className, label, error, state = "idle", helperText, icon, ...props }, ref) => {
    const borderColors = {
      idle: "border-gray-300 focus:border-blue-500",
      focused: "border-blue-500 ring-1 ring-blue-500",
      validating: "border-blue-300 bg-blue-50",
      valid: "border-green-500 bg-green-50",
      invalid: "border-2 border-red-500 bg-red-50",
      error: "border-2 border-red-500 bg-red-100",
    };

    const inputClasses = cn(
      "flex h-12 w-full rounded-md border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground transition-all",
      "focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
      borderColors[state],
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}

        <div className="relative">
          <input ref={ref} className={inputClasses} {...props} />

          {/* Status Icon */}
          {state === "validating" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            </div>
          )}
          {state === "valid" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          )}
          {(state === "invalid" || state === "error") && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (state === "invalid" || state === "error") && (
          <div className="mt-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <p className={cn(
              "text-sm font-medium",
              state === "error" ? "text-red-800" : "text-red-700"
            )}>
              {error}
            </p>
          </div>
        )}

        {/* Helper Text (success message) */}
        {helperText && state !== "invalid" && state !== "error" && (
          <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

export { FormField, type FieldState };
