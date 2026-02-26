"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Loader2, Mail, Pencil, Send } from "lucide-react";

interface UserEmailActionsProps {
  userId: string;
  currentEmail: string;
  emailConfirmed: boolean;
}

export function UserEmailActions({
  userId,
  currentEmail,
  emailConfirmed,
}: UserEmailActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();

  async function handleResend() {
    setResending(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/email`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to resend confirmation");
        return;
      }

      toast.success(`Confirmation email sent to ${data.email}`);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!emailConfirmed && (
        <button
          onClick={handleResend}
          disabled={resending}
          className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
        >
          {resending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Resend Confirmation
        </button>
      )}

      <button
        onClick={() => setEditOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit Email
      </button>

      {editOpen && (
        <EditEmailModal
          userId={userId}
          currentEmail={currentEmail}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}

/* ── Edit Email Modal ── */

function EditEmailModal({
  userId,
  currentEmail,
  onClose,
}: {
  userId: string;
  currentEmail: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState(currentEmail);

  const isValid =
    email.trim().length > 0 &&
    email.includes("@") &&
    email.trim() !== currentEmail;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/email`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to update email");
        return;
      }

      toast.success(`Email updated to ${data.email}`);

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
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-foreground">Edit Email</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Current:{" "}
          <span className="font-medium text-foreground">{currentEmail}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="new-email"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              New Email <span className="text-red-400">*</span>
            </label>
            <input
              id="new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <p className="text-xs text-amber-300">
              This will update both the auth email and profile. The email will be
              automatically confirmed — no verification needed.
            </p>
          </div>

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
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Update Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
