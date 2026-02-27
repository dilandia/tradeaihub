"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";
import {
  createTicket,
  getUserTickets,
  getTicketDetail,
  cancelTicket,
  replyToUserTicket,
} from "@/app/actions/support-tickets";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bug,
  Lightbulb,
  CreditCard,
  UserCircle,
  HelpCircle,
  Loader2,
  Ticket,
  Clock,
  XCircle,
  ChevronRight,
  Send,
  Paperclip,
  X,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TicketRow = {
  id: string;
  ticket_number: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type TicketDetail = TicketRow & {
  description: string;
  replies: { id: string; content: string; is_admin: boolean; attachment_url: string | null; created_at: string }[];
};

type View = "form" | "list" | "detail";

const CATEGORIES = [
  { value: "bug", icon: Bug, tKey: "support.ticketCategoryBug" },
  { value: "feature", icon: Lightbulb, tKey: "support.ticketCategoryFeature" },
  { value: "billing", icon: CreditCard, tKey: "support.ticketCategoryBilling" },
  { value: "account", icon: UserCircle, tKey: "support.ticketCategoryAccount" },
  { value: "other", icon: HelpCircle, tKey: "support.ticketCategoryOther" },
] as const;

const STATUS_STYLES: Record<string, string> = {
  open: "bg-yellow-500/10 text-yellow-500",
  in_progress: "bg-blue-500/10 text-blue-500",
  resolved: "bg-green-500/10 text-green-500",
  closed: "bg-muted text-muted-foreground",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-red-500/10 text-red-500",
};

const CATEGORY_ICONS: Record<string, typeof Bug> = {
  bug: Bug,
  feature: Lightbulb,
  billing: CreditCard,
  account: UserCircle,
  other: HelpCircle,
};

export function SupportTickets() {
  const { t } = useLanguage();
  const [view, setView] = useState<View>("form");
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Form state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>("bug");
  const [priority, setPriority] = useState<string>("medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formAttachment, setFormAttachment] = useState<File | null>(null);
  const [formPreview, setFormPreview] = useState<string | null>(null);

  // Reply state
  const [replyContent, setReplyContent] = useState("");
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null);
  const [replyPreview, setReplyPreview] = useState<string | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  // Lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setLoadingTickets(true);
    const data = await getUserTickets();
    setTickets(data as TicketRow[]);
    setLoadingTickets(false);
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleFormAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("support.ticketImageInvalidType"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("support.ticketImageTooLarge"));
      return;
    }
    setFormAttachment(file);
    setFormPreview(URL.createObjectURL(file));
  };

  const handleFormRemoveAttach = () => {
    if (formPreview) URL.revokeObjectURL(formPreview);
    setFormAttachment(null);
    setFormPreview(null);
  };

  const handleSubmit = async () => {
    if (subject.trim().length < 1 || description.trim().length < 20) return;

    setSubmitting(true);
    try {
      const result = await createTicket({
        subject: subject.trim(),
        category: category as "bug" | "feature" | "billing" | "account" | "other",
        priority: priority as "low" | "medium" | "high",
        description: description.trim(),
      });

      if (result.success && result.ticketId) {
        // Upload image as first reply if attached
        if (formAttachment) {
          const formData = new FormData();
          formData.append("file", formAttachment);
          formData.append("ticketId", result.ticketId);
          const uploadRes = await fetch("/api/support/upload", {
            method: "POST",
            body: formData,
          });
          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            await replyToUserTicket({
              ticketId: result.ticketId,
              content: "[Screenshot]",
              attachmentUrl: url,
            });
          }
        }

        toast.success(t("support.ticketSuccess"));
        setSubject("");
        setCategory("bug");
        setPriority("medium");
        setDescription("");
        handleFormRemoveAttach();
        setView("list");
        loadTickets();
      } else {
        toast.error(result.error ?? t("support.ticketError"));
      }
    } catch {
      toast.error(t("support.ticketError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewTicket = async (ticketId: string) => {
    setLoadingDetail(true);
    setView("detail");
    const detail = await getTicketDetail(ticketId);
    setSelectedTicket(detail as TicketDetail | null);
    setLoadingDetail(false);
  };

  const handleCancelTicket = async () => {
    if (!selectedTicket) return;
    setCancelling(true);
    try {
      const result = await cancelTicket(selectedTicket.id);
      if (result.success) {
        toast.success(t("support.ticketCancelled"));
        setView("list");
        setSelectedTicket(null);
        loadTickets();
      } else {
        toast.error(result.error ?? t("support.ticketError"));
      }
    } catch {
      toast.error(t("support.ticketError"));
    } finally {
      setCancelling(false);
    }
  };

  const handleAttachImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("support.ticketImageInvalidType"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("support.ticketImageTooLarge"));
      return;
    }

    setReplyAttachment(file);
    setReplyPreview(URL.createObjectURL(file));
  };

  const handleRemoveAttachment = () => {
    if (replyPreview) URL.revokeObjectURL(replyPreview);
    setReplyAttachment(null);
    setReplyPreview(null);
  };

  const handleSendReply = async () => {
    if (!selectedTicket || (!replyContent.trim() && !replyAttachment)) return;

    setSendingReply(true);
    try {
      let attachmentUrl: string | undefined;

      // Upload image if attached
      if (replyAttachment) {
        const formData = new FormData();
        formData.append("file", replyAttachment);
        formData.append("ticketId", selectedTicket.id);

        const uploadRes = await fetch("/api/support/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          toast.error(err.error ?? t("support.ticketReplyError"));
          setSendingReply(false);
          return;
        }

        const uploadData = await uploadRes.json();
        attachmentUrl = uploadData.url;
      }

      const result = await replyToUserTicket({
        ticketId: selectedTicket.id,
        content: replyContent.trim() || (replyAttachment ? "[Image]" : ""),
        attachmentUrl,
      });

      if (result.success) {
        toast.success(t("support.ticketReplySuccess"));

        // Optimistic update
        setSelectedTicket((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: prev.status === "resolved" ? "open" : prev.status,
            replies: [
              ...prev.replies,
              {
                id: crypto.randomUUID(),
                content: replyContent.trim() || "[Image]",
                is_admin: false,
                attachment_url: attachmentUrl ?? null,
                created_at: new Date().toISOString(),
              },
            ],
          };
        });

        setReplyContent("");
        handleRemoveAttachment();
      } else {
        toast.error(result.error ?? t("support.ticketReplyError"));
      }
    } catch {
      toast.error(t("support.ticketReplyError"));
    } finally {
      setSendingReply(false);
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      open: t("support.ticketStatusOpen"),
      in_progress: t("support.ticketStatusInProgress"),
      resolved: t("support.ticketStatusResolved"),
      closed: t("support.ticketStatusClosed"),
    };
    return map[status] ?? status;
  };

  const categoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      bug: t("support.ticketCategoryBug"),
      feature: t("support.ticketCategoryFeature"),
      billing: t("support.ticketCategoryBilling"),
      account: t("support.ticketCategoryAccount"),
      other: t("support.ticketCategoryOther"),
    };
    return map[cat] ?? cat;
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Tab bar (hidden in detail view) */}
      {view !== "detail" && (
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setView("form")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              view === "form"
                ? "border-b-2 border-score text-score"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("support.createTicket")}
          </button>
          <button
            type="button"
            onClick={() => {
              setView("list");
              loadTickets();
            }}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              view === "list"
                ? "border-b-2 border-score text-score"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("support.ticketsTitle")} {tickets.length > 0 && `(${tickets.length})`}
          </button>
        </div>
      )}

      <div className="p-4">
        {/* ─── FORM VIEW ─── */}
        {view === "form" && (
          <div className="space-y-4">
            {/* Subject */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("support.ticketSubject")} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t("support.ticketSubjectPlaceholder")}
                maxLength={200}
                className={cn(
                  "w-full rounded-lg border border-border bg-background px-3 py-2",
                  "text-sm text-foreground placeholder:text-muted-foreground",
                  "transition-colors focus:border-score focus:outline-none focus:ring-1 focus:ring-score"
                )}
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("support.ticketCategory")}
              </label>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORIES.map(({ value, icon: Icon, tKey }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-[10px] transition-all sm:text-xs",
                      category === value
                        ? "border-score bg-score/10 text-score"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-center leading-tight">{t(tKey)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("support.ticketPriority")}
              </label>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                      priority === p
                        ? "border-score bg-score/10 text-score"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    )}
                  >
                    {t(`support.ticketPriority${p.charAt(0).toUpperCase() + p.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("support.ticketDescription")} <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("support.ticketDescriptionPlaceholder")}
                rows={5}
                className={cn(
                  "w-full resize-none rounded-lg border border-border bg-background px-3 py-2",
                  "text-sm text-foreground placeholder:text-muted-foreground",
                  "transition-colors focus:border-score focus:outline-none focus:ring-1 focus:ring-score"
                )}
              />
              {description.length > 0 && description.trim().length < 20 && (
                <p className="mt-1 text-xs text-red-400">
                  {t("support.ticketDescriptionMin")}
                </p>
              )}
            </div>

            {/* Attachment (optional) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("support.ticketAttachImage")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({t("support.ticketAttachOptional")})
                </span>
              </label>
              {formPreview ? (
                <div className="relative inline-block">
                  <img
                    src={formPreview}
                    alt="Preview"
                    className="max-h-[120px] rounded-lg border border-border object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleFormRemoveAttach}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-loss text-white text-xs hover:bg-loss/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label
                  className={cn(
                    "flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-3",
                    "text-sm text-muted-foreground transition-colors hover:border-score hover:text-score"
                  )}
                >
                  <Paperclip className="h-4 w-4" />
                  {t("support.ticketAttachClick")}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={handleFormAttach}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || subject.trim().length < 1 || description.trim().length < 20}
              className={cn(
                "w-full rounded-lg bg-score px-4 py-2.5 text-sm font-medium text-white",
                "transition-colors hover:bg-score/90",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("support.ticketSubmitting")}
                </span>
              ) : (
                t("support.ticketSubmit")
              )}
            </button>
          </div>
        )}

        {/* ─── LIST VIEW ─── */}
        {view === "list" && (
          <div className="space-y-3">
            {loadingTickets ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Ticket className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t("support.ticketsEmpty")}</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => handleViewTicket(ticket.id)}
                  className="flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/50">
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">#{ticket.ticket_number}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          STATUS_STYLES[ticket.status] ?? STATUS_STYLES.open
                        )}
                      >
                        {statusLabel(ticket.status)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                      {ticket.subject}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/50" />
                </button>
              ))
            )}
          </div>
        )}

        {/* ─── DETAIL VIEW ─── */}
        {view === "detail" && (
          <div className="space-y-4">
            {/* Back button */}
            <button
              type="button"
              onClick={() => {
                setView("list");
                setSelectedTicket(null);
              }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("support.ticketBack")}
            </button>

            {loadingDetail ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : selectedTicket ? (
              <>
                {/* Ticket header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          #{selectedTicket.ticket_number}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            STATUS_STYLES[selectedTicket.status] ?? STATUS_STYLES.open
                          )}
                        >
                          {statusLabel(selectedTicket.status)}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            PRIORITY_STYLES[selectedTicket.priority] ?? PRIORITY_STYLES.medium
                          )}
                        >
                          {t(`support.ticketPriority${selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}`)}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-foreground">
                        {selectedTicket.subject}
                      </h3>
                    </div>
                    {(() => {
                      const CatIcon = CATEGORY_ICONS[selectedTicket.category] ?? HelpCircle;
                      return (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50">
                            <CatIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {categoryLabel(selectedTicket.category)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(selectedTicket.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="rounded-lg border border-border bg-muted/10 p-4">
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Replies */}
                {selectedTicket.replies.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">
                      {t("support.ticketReplies")}
                    </h4>
                    {selectedTicket.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={cn(
                          "rounded-lg border p-3",
                          reply.is_admin
                            ? "border-score/20 bg-score/5"
                            : "border-border bg-muted/10"
                        )}
                      >
                        <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">
                            {reply.is_admin ? "Support Team" : t("support.ticketYou")}
                          </span>
                          <span>{new Date(reply.created_at).toLocaleString()}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-foreground">
                          {reply.content}
                        </p>
                        {reply.attachment_url && (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl(reply.attachment_url)}
                            className="mt-2 block"
                          >
                            <img
                              src={reply.attachment_url}
                              alt="Attachment"
                              className="max-h-[200px] rounded-lg border border-border object-contain cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply form (not for closed tickets) */}
                {selectedTicket.status !== "closed" && (
                  <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-3">
                    {selectedTicket.status === "resolved" && (
                      <p className="text-xs text-yellow-500">
                        {t("support.ticketReopenNote")}
                      </p>
                    )}
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={t("support.ticketReplyPlaceholder")}
                      rows={3}
                      maxLength={5000}
                      className={cn(
                        "w-full resize-none rounded-lg border border-border bg-background px-3 py-2",
                        "text-sm text-foreground placeholder:text-muted-foreground",
                        "transition-colors focus:border-score focus:outline-none focus:ring-1 focus:ring-score"
                      )}
                    />

                    {/* Attachment preview */}
                    {replyPreview && (
                      <div className="relative inline-block">
                        <img
                          src={replyPreview}
                          alt="Preview"
                          className="max-h-[120px] rounded-lg border border-border object-contain"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveAttachment}
                          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-loss text-white text-xs hover:bg-loss/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <Paperclip className="h-3.5 w-3.5" />
                        {t("support.ticketAttachImage")}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/gif,image/webp"
                          onChange={handleAttachImage}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleSendReply}
                        disabled={sendingReply || (!replyContent.trim() && !replyAttachment)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg bg-score px-3 py-1.5 text-xs font-medium text-white",
                          "transition-colors hover:bg-score/90",
                          "disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                      >
                        {sendingReply ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        {sendingReply ? t("support.ticketReplySending") : t("support.ticketReplySend")}
                      </button>
                    </div>
                  </div>
                )}

                {/* Cancel button (only for open/in_progress tickets) */}
                {(selectedTicket.status === "open" || selectedTicket.status === "in_progress") && (
                  <button
                    type="button"
                    onClick={handleCancelTicket}
                    disabled={cancelling}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg border border-loss/20 px-4 py-2 text-sm font-medium text-loss/80",
                      "transition-colors hover:bg-loss/5",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    {cancelling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {t("support.ticketCancel")}
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("support.ticketNotFound")}</p>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
