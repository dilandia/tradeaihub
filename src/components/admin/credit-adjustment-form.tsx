"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Plus, Minus, Loader2 } from "lucide-react";

interface CreditAdjustmentFormProps {
  userId: string;
  currentBalance: number;
  onClose: () => void;
}

export function CreditAdjustmentForm({
  userId,
  currentBalance,
  onClose,
}: CreditAdjustmentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const numericAmount = Math.abs(Number(amount) || 0);
  const isValid = numericAmount > 0 && reason.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    const finalAmount = action === "add" ? numericAmount : -numericAmount;

    try {
      const res = await fetch(`/api/admin/users/${userId}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount, reason: reason.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to adjust credits");
        return;
      }

      toast.success(
        `Credits updated: ${data.balance_before} -> ${data.balance_after}`
      );

      startTransition(() => {
        router.refresh();
      });

      onClose();
    } catch {
      toast.error("Network error. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold text-foreground">
          Manage AI Credits
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Current balance:{" "}
          <span className="font-medium text-foreground">
            {currentBalance.toLocaleString("en-US")}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Action Toggle */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Action
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAction("add")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  action === "add"
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
              <button
                type="button"
                onClick={() => setAction("remove")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  action === "remove"
                    ? "border-red-500/50 bg-red-500/15 text-red-400"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Minus className="h-4 w-4" />
                Remove
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label
              htmlFor="credit-amount"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Amount
            </label>
            <input
              id="credit-amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter credit amount"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Reason */}
          <div>
            <label
              htmlFor="credit-reason"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Reason <span className="text-red-400">*</span>
            </label>
            <input
              id="credit-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Customer support compensation"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Preview */}
          {numericAmount > 0 && (
            <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                New balance:{" "}
                <span className="font-semibold text-foreground">
                  {(action === "add"
                    ? currentBalance + numericAmount
                    : Math.max(0, currentBalance - numericAmount)
                  ).toLocaleString("en-US")}
                </span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
