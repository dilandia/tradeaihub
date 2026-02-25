"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bug,
  Lightbulb,
  Sparkles,
  HelpCircle,
  Star,
  Eye,
  CheckCircle2,
  ExternalLink,
  Loader2,
  StickyNote,
} from "lucide-react";

interface FeedbackItem {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  type: string;
  rating: number | null;
  message: string;
  page_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface FeedbackListProps {
  items: FeedbackItem[];
  currentStatus: string;
  currentType: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  new: {
    label: "New",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  reviewed: {
    label: "Reviewed",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
};

const TYPE_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  bug: {
    label: "Bug",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: <Bug className="h-3.5 w-3.5" />,
  },
  feature: {
    label: "Feature",
    className: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    icon: <Lightbulb className="h-3.5 w-3.5" />,
  },
  improvement: {
    label: "Improvement",
    className: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    icon: <Sparkles className="h-3.5 w-3.5" />,
  },
  other: {
    label: "Other",
    className: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    icon: <HelpCircle className="h-3.5 w-3.5" />,
  },
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

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.other;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function FeedbackCard({ item }: { item: FeedbackItem }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState(item.admin_notes ?? "");

  async function updateStatus(newStatus: string) {
    setLoading(newStatus);
    try {
      const res = await fetch(`/api/admin/feedback/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          admin_notes: adminNotes || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Failed to update feedback status:", err);
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to update feedback status:", error);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-border/80">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={item.type} />
          <StatusBadge status={item.status} />
          {item.rating !== null && <RatingStars rating={item.rating} />}
        </div>
        <time className="text-xs text-muted-foreground">
          {formatDate(item.created_at)}
        </time>
      </div>

      {/* Message */}
      <p className="mt-3 text-sm leading-relaxed text-foreground">
        {item.message}
      </p>

      {/* User info + page url */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          {item.full_name ? `${item.full_name} (${item.email})` : item.email}
        </span>
        {item.page_url && (
          <span className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            {item.page_url}
          </span>
        )}
        {item.resolved_at && (
          <span>Resolved {formatDate(item.resolved_at)}</span>
        )}
      </div>

      {/* Admin notes (existing) */}
      {item.admin_notes && !notesOpen && (
        <div className="mt-3 rounded-lg border border-border bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <StickyNote className="h-3 w-3" />
            Admin Notes
          </div>
          <p className="mt-1 text-xs text-foreground">{item.admin_notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {item.status !== "reviewed" && (
          <button
            onClick={() => updateStatus("reviewed")}
            disabled={loading !== null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
          >
            {loading === "reviewed" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            Mark Reviewed
          </button>
        )}
        {item.status !== "resolved" && (
          <button
            onClick={() => updateStatus("resolved")}
            disabled={loading !== null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {loading === "resolved" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Mark Resolved
          </button>
        )}
        <button
          onClick={() => setNotesOpen(!notesOpen)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <StickyNote className="h-3.5 w-3.5" />
          {notesOpen ? "Hide Notes" : "Add Notes"}
        </button>
      </div>

      {/* Notes editor */}
      {notesOpen && (
        <div className="mt-3 space-y-2">
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Write admin notes..."
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="text-xs text-muted-foreground">
            Notes will be saved when you update the status.
          </p>
        </div>
      )}
    </div>
  );
}

export function FeedbackList({
  items,
  currentStatus,
  currentType,
}: FeedbackListProps) {
  const router = useRouter();

  function handleFilterChange(key: string, value: string) {
    const params = new URLSearchParams();
    if (key === "status" && value) {
      params.set("status", value);
    } else if (currentStatus) {
      params.set("status", currentStatus);
    }
    if (key === "type" && value) {
      params.set("type", value);
    } else if (currentType) {
      params.set("type", currentType);
    }
    // Remove empty params
    if (key === "status" && !value) params.delete("status");
    if (key === "type" && !value) params.delete("type");

    const qs = params.toString();
    router.push(`/admin/feedback${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={currentStatus}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={currentType}
          onChange={(e) => handleFilterChange("type", e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Types</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
          <option value="improvement">Improvement</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Feedback cards */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <p className="text-lg font-medium text-foreground">
            No feedback found
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <FeedbackCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
