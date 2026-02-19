"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Send, Loader2, Zap, MessageSquarePlus, PanelLeftClose, PanelLeft, Pencil } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { usePlan } from "@/contexts/plan-context";
import { useAiApiParams } from "@/hooks/use-ai-api";
import {
  fetchAiCopilotStream,
  fetchCopilotSuggestions,
  fetchCopilotConversations,
  fetchCopilotConversation,
  fetchCopilotUpdateConversationTitle,
  type ContextualSuggestion,
  type CopilotConversation,
} from "@/hooks/use-ai-api";
import { CopilotMessage } from "./copilot-message";
import { UpgradePlanModal } from "./upgrade-plan-modal";
import { isPlanGateError } from "@/lib/ai/plan-gate-error";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string; timestamp: Date };

function formatConversationDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(d);
  if (diffDays === 1) return locale.startsWith("pt") ? "Ontem" : "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString(locale, { weekday: "short" });
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

type AiCopilotContentProps = {
  /** Quando true, usa altura do container em vez da viewport (para janela flutuante) */
  compact?: boolean;
};

export function AiCopilotContent({ compact }: AiCopilotContentProps = {}) {
  const { t, locale } = useLanguage();
  const { planInfo } = usePlan();
  const params = useAiApiParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planGateModal, setPlanGateModal] = useState<{
    message: string;
    variant: "plan" | "credits";
  } | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<CopilotConversation[]>([]);
  const [suggestions, setSuggestions] = useState<ContextualSuggestion[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(!compact);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadSuggestions = useCallback(async () => {
    try {
      const s = await fetchCopilotSuggestions({
        importId: params.importId,
        accountId: params.accountId,
        period: params.period ?? "all",
      });
      setSuggestions(s);
    } catch {
      setSuggestions([]);
    }
  }, [params.importId, params.accountId, params.period]);

  const loadConversations = useCallback(async () => {
    try {
      const c = await fetchCopilotConversations();
      setConversations(c);
    } catch {
      setConversations([]);
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    setEditingId(null);
    try {
      const msgs = await fetchCopilotConversation(id);
      setMessages(
        msgs.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.created_at),
        }))
      );
      setConversationId(id);
    } catch {
      setMessages([]);
    }
  }, []);

  const startNewConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setEditingId(null);
    loadSuggestions();
  }, [loadSuggestions]);

  async function handleSaveTitle(id: string, newTitle: string) {
    const trimmed = newTitle.trim();
    setEditingId(null);
    if (!trimmed) return;
    const ok = await fetchCopilotUpdateConversationTitle(id, trimmed);
    if (ok) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c))
      );
    }
  }

  useEffect(() => {
    loadSuggestions();
    loadConversations();
  }, [loadSuggestions, loadConversations]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamingContent]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed, timestamp: new Date() }]);
    setIsLoading(true);
    setError(null);
    setStreamingContent("");

    try {
      const { content, conversationId: newConvId } = await fetchAiCopilotStream(
        {
          ...params,
          message: trimmed,
          conversationId: conversationId ?? undefined,
        },
        (chunk) => setStreamingContent((prev) => prev + chunk)
      );

      setConversationId(newConvId || null);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: content.trim(), timestamp: new Date() },
      ]);
      setStreamingContent("");
      loadConversations();
    } catch (e) {
      if (isPlanGateError(e)) {
        setPlanGateModal({
          message: t(e.errorKey),
          variant: e.code,
        });
        setMessages((prev) => prev.slice(0, -1));
      } else {
        const msg = e instanceof Error ? e.message : "Error";
        setError(msg.startsWith("planErrors.") ? t(msg) : msg);
      }
      setStreamingContent("");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleSuggestionClick(s: ContextualSuggestion) {
    sendMessage(t(`aiCopilot.suggestedQueries.${s.queryKey}`));
  }

  const FALLBACK_SUGGESTIONS: ContextualSuggestion[] = [
    { queryKey: "performanceSummary", reasonKey: "general", priority: 0 },
    { queryKey: "riskConsistency", reasonKey: "general", priority: 0 },
    { queryKey: "improve", reasonKey: "general", priority: 0 },
    { queryKey: "bestWorstDay", reasonKey: "general", priority: 0 },
    { queryKey: "overtrading", reasonKey: "general", priority: 0 },
    { queryKey: "winRateConsistency", reasonKey: "general", priority: 0 },
  ];

  const displaySuggestions = (() => {
    if (suggestions.length === 0) return FALLBACK_SUGGESTIONS;
    if (suggestions.length >= 6) return suggestions;
    const keys = new Set(suggestions.map((s) => s.queryKey));
    const padded = [...suggestions];
    for (const fallback of FALLBACK_SUGGESTIONS) {
      if (padded.length >= 6) break;
      if (!keys.has(fallback.queryKey)) {
        padded.push(fallback);
        keys.add(fallback.queryKey);
      }
    }
    return padded;
  })();

  return (
    <>
      {planGateModal && (
        <UpgradePlanModal
          open={!!planGateModal}
          onClose={() => setPlanGateModal(null)}
          message={planGateModal.message}
          variant={planGateModal.variant}
        />
      )}
      <div
        className={cn(
          "relative flex overflow-hidden rounded-2xl border border-border bg-card shadow-lg",
          compact ? "h-full min-h-0" : "h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]"
        )}
      >
        {/* Backdrop mobile - oculto em compact */}
        {!compact && sidebarOpen && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
            className="fixed inset-0 z-10 bg-black/20 md:hidden"
            aria-label={t("common.closeMenu")}
          />
        )}
        {/* Sidebar - Histórico (oculto em compact) */}
        {!compact && (
        <aside
          className={cn(
            "flex shrink-0 flex-col border-r border-border bg-muted/30 transition-all duration-300",
            "z-20 md:relative md:z-auto",
            sidebarOpen
              ? "absolute inset-y-0 left-0 w-64 sm:w-72 md:relative md:w-64 lg:w-72 shadow-xl md:shadow-none"
              : "w-0 overflow-hidden md:w-0"
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
            <span className="text-sm font-medium text-foreground">
              {t("aiCopilot.conversationHistory")}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <button
              type="button"
              onClick={startNewConversation}
              className={cn(
                "mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm",
                "bg-violet-500/15 text-violet-700 dark:text-violet-300",
                "hover:bg-violet-500/25 transition-colors"
              )}
            >
              <MessageSquarePlus className="h-4 w-4 shrink-0" />
              {t("aiCopilot.newConversation")}
            </button>
            {conversations.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "group mb-1 flex w-full flex-col rounded-xl px-3 py-2.5 transition-colors",
                  conversationId === c.id
                    ? "bg-violet-500/20 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500/30"
                    : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => editingId !== c.id && loadConversation(c.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    {editingId === c.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleSaveTitle(c.id, editingTitle)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveTitle(c.id, editingTitle);
                          }
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded border border-violet-500/50 bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                        autoFocus
                      />
                    ) : (
                      <>
                        <span className="block truncate text-sm font-medium">
                          {c.title?.trim() || formatConversationDate(c.updated_at, locale ?? "en")}
                        </span>
                        <span className="block text-xs opacity-75">
                          {new Date(c.updated_at).toLocaleTimeString(locale ?? "en", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </>
                    )}
                  </button>
                  {editingId !== c.id && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(c.id);
                        setEditingTitle(c.title?.trim() || "");
                      }}
                      className="shrink-0 rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-muted/80 transition-opacity"
                      aria-label={t("common.edit")}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>
        )}

        {/* Main - Chat */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Header - oculto em modo compact (janela flutuante tem seu próprio header) */}
          {!compact && (
          <header className="flex shrink-0 items-center justify-between border-b border-border bg-card/50 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                aria-label={sidebarOpen ? "Fechar histórico" : "Abrir histórico"}
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelLeft className="h-5 w-5" />
                )}
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-md shadow-violet-500/20">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">{t("aiCopilot.header")}</h1>
                  <p className="text-xs text-muted-foreground">
                    {t("aiCopilot.subtitle")}
                  </p>
                </div>
              </div>
            </div>
            {planInfo && (
              <Link
                href="/settings/subscription"
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                {t("aiHub.creditsRemaining", {
                  count: planInfo.aiCreditsRemaining,
                  total: planInfo.aiCreditsPerMonth,
                })}
              </Link>
            )}
          </header>
          )}

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto bg-gradient-to-b from-background/30 to-background p-4 sm:p-6"
          >
            {messages.length === 0 && !streamingContent && (
              <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 py-16 text-center">
                <div className="rounded-2xl bg-violet-500/10 p-6">
                  <Zap className="h-12 w-12 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {t("aiCopilot.suggestions.justAsk")}
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    {t("aiCopilot.suggestions.naturalQueries")}
                  </p>
                </div>
                <div className="grid w-full gap-3 sm:grid-cols-2">
                  {displaySuggestions.map((s) => (
                    <button
                      key={s.queryKey}
                      type="button"
                      onClick={() => handleSuggestionClick(s)}
                      className={cn(
                        "group rounded-2xl border border-border bg-card/80 px-5 py-4 text-left",
                        "shadow-sm transition-all hover:border-violet-500/40 hover:shadow-md hover:shadow-violet-500/5"
                      )}
                    >
                      <span className="font-medium text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400">
                        {t(`aiCopilot.suggestedQueries.${s.queryKey}`)}
                      </span>
                      {s.reasonKey !== "general" && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t(`aiCopilot.suggestionReasons.${s.reasonKey}`)}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mx-auto max-w-2xl space-y-6">
              {messages.map((msg, i) => (
                <CopilotMessage
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                />
              ))}
              {isLoading && streamingContent && (
                <div className="flex justify-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/20">
                    <Zap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-border bg-card/90 px-5 py-4 shadow-sm">
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {streamingContent}
                      <span
                        className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-violet-500"
                        aria-hidden
                      />
                    </p>
                  </div>
                </div>
              )}
              {isLoading && !streamingContent && (
                <div className="flex justify-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/20">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md border border-border bg-card/90 px-5 py-4 shadow-sm">
                    <p className="text-sm text-muted-foreground">{t("common.aiAnalyzing")}</p>
                  </div>
                </div>
              )}
              {error && (
                <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-border bg-card/50 p-4 backdrop-blur-sm"
          >
            <div className="mx-auto flex max-w-2xl gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("aiCopilot.placeholder")}
                disabled={isLoading}
                className={cn(
                  "flex-1 rounded-xl border border-border bg-background px-4 py-3.5 text-sm",
                  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50",
                  "disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
                )}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                  "bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-md shadow-violet-500/25",
                  "hover:from-violet-700 hover:to-violet-800 disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all hover:shadow-lg hover:shadow-violet-500/30"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </form>
          {/* Disclaimer fixo abaixo do box de conversa */}
          <p className="text-center text-[10px] text-muted-foreground px-4 py-2">
            {t("aiCopilot.disclaimer")}
          </p>
        </div>
      </div>
    </>
  );
}
