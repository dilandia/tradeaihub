"use client";

import { useState, useTransition } from "react";
import {
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  PlayCircle,
  Loader2,
  User,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  updateTicketStatus,
  replyToTicket,
} from "@/app/actions/admin-tickets";
import type { AdminTicketDetail } from "@/app/actions/admin-tickets";

type Props = {
  ticket: AdminTicketDetail;
};

const STATUS_OPTIONS = [
  { value: "open", label: "Open", icon: Clock, color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  { value: "in_progress", label: "In Progress", icon: PlayCircle, color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  { value: "resolved", label: "Resolved", icon: CheckCircle2, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  { value: "closed", label: "Closed", icon: XCircle, color: "text-red-400 bg-red-400/10 border-red-400/30" },
] as const;

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-blue-400 bg-blue-400/10",
  medium: "text-amber-400 bg-amber-400/10",
  high: "text-red-400 bg-red-400/10",
};

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug Report",
  feature: "Feature Request",
  billing: "Billing",
  account: "Account",
  other: "Other",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function TicketDetailClient({ ticket: initialTicket }: Props) {
  const [ticket, setTicket] = useState(initialTicket);
  const [replyContent, setReplyContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSending, setIsSending] = useState(false);

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      const result = await updateTicketStatus(
        ticket.id,
        newStatus as "open" | "in_progress" | "resolved" | "closed"
      );
      if (result.success) {
        setTicket((prev) => ({ ...prev, status: newStatus }));
        toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
      } else {
        toast.error(result.error ?? "Failed to update status");
      }
    });
  }

  async function handleReply() {
    if (!replyContent.trim()) return;
    setIsSending(true);
    try {
      const result = await replyToTicket(ticket.id, replyContent);
      if (result.success) {
        setTicket((prev) => ({
          ...prev,
          status: prev.status === "open" ? "in_progress" : prev.status,
          replies: [
            ...prev.replies,
            {
              id: crypto.randomUUID(),
              content: replyContent.trim(),
              is_admin: true,
              created_at: new Date().toISOString(),
              author_email: "admin",
            },
          ],
        }));
        setReplyContent("");
        toast.success("Reply sent");
      } else {
        toast.error(result.error ?? "Failed to send reply");
      }
    } finally {
      setIsSending(false);
    }
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === ticket.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-mono text-muted-foreground">
              #{ticket.ticket_number}
            </span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", PRIORITY_COLORS[ticket.priority])}>
              {ticket.priority.toUpperCase()}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {CATEGORY_LABELS[ticket.category] ?? ticket.category}
            </span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-foreground">{ticket.subject}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            From <span className="font-medium text-foreground">{ticket.user_name ?? ticket.user_email}</span>
            {" "}&middot;{" "}{formatDate(ticket.created_at)}
          </p>
        </div>

        {/* Status Selector */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = ticket.status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isPending || isActive}
                onClick={() => handleStatusChange(opt.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? opt.color
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {ticket.user_name ?? ticket.user_email}
          </span>
          <span className="text-xs text-muted-foreground">&middot; {timeAgo(ticket.created_at)}</span>
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {ticket.description}
        </p>
      </div>

      {/* Replies */}
      {ticket.replies.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Replies ({ticket.replies.length})
          </h3>
          {ticket.replies.map((reply) => (
            <div
              key={reply.id}
              className={cn(
                "rounded-xl border p-4",
                reply.is_admin
                  ? "border-indigo-500/20 bg-indigo-500/5"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {reply.is_admin ? (
                  <Shield className="h-3.5 w-3.5 text-indigo-400" />
                ) : (
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className={cn("text-xs font-medium", reply.is_admin ? "text-indigo-400" : "text-foreground")}>
                  {reply.is_admin ? "Admin" : reply.author_email}
                </span>
                <span className="text-xs text-muted-foreground">&middot; {timeAgo(reply.created_at)}</span>
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {reply.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Reply Form */}
      {ticket.status !== "closed" && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Reply as Admin</h3>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Type your reply..."
            rows={4}
            className={cn(
              "w-full rounded-lg border border-border bg-background px-4 py-3",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
              "resize-none"
            )}
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {replyContent.length}/5000
            </p>
            <button
              type="button"
              disabled={!replyContent.trim() || isSending}
              onClick={handleReply}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                "bg-indigo-500 text-white hover:bg-indigo-600",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
