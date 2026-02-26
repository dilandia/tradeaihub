"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Send, Bot, User, Loader2, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function SupportChat() {
  const { t, locale } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatLimited, setChatLimited] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const suggestions = [
    t("support.chatSuggestion1"),
    t("support.chatSuggestion2"),
    t("support.chatSuggestion3"),
    t("support.chatSuggestion4"),
  ];

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setStreaming(true);

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        const res = await fetch("/api/support/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            conversationId,
            locale,
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const newConvId = res.headers.get("X-Conversation-Id");
        if (newConvId) setConversationId(newConvId);

        if (res.headers.get("X-Chat-Limited") === "true") {
          setChatLimited(true);
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let done = false;
          while (!done) {
            const result = await reader.read();
            done = result.done;
            if (result.value) {
              const chunk = decoder.decode(result.value, { stream: true });
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + chunk }
                    : m
                )
              );
            }
          }
        }
      } catch (err) {
        console.error("[SupportChat]", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: t("support.chatError") }
              : m
          )
        );
      } finally {
        setStreaming(false);
      }
    },
    [conversationId, locale, streaming, t]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4" style={{ maxHeight: "28rem", minHeight: "16rem" }}>
        {messages.length === 0 ? (
          <div className="space-y-4">
            {/* Welcome */}
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-score/10">
                <Bot className="h-4 w-4 text-score" />
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground">
                {t("support.chatWelcome")}
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-2 pl-11">
              <p className="text-xs font-medium text-muted-foreground">
                {t("support.chatSuggestions")}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendMessage(s)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:border-score hover:bg-score/5"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  msg.role === "assistant" ? "bg-score/10" : "bg-muted"
                )}
              >
                {msg.role === "assistant" ? (
                  <Bot className="h-4 w-4 text-score" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-sm",
                  msg.role === "assistant"
                    ? "bg-muted/50 text-foreground"
                    : "bg-score/10 text-foreground"
                )}
              >
                {msg.content || (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input / Ticket CTA */}
      <div className="border-t border-border p-3">
        {chatLimited ? (
          <button
            type="button"
            onClick={() => {
              // Emit custom event so parent (SupportSection) can switch to ticket panel
              window.dispatchEvent(new CustomEvent("support:open-ticket"));
            }}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg py-2.5",
              "bg-score text-white text-sm font-medium transition-colors hover:bg-score/90"
            )}
          >
            <Ticket className="h-4 w-4" />
            {t("support.openTicketCta")}
          </button>
        ) : (
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("support.chatPlaceholder")}
              rows={1}
              disabled={streaming}
              className={cn(
                "flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2",
                "text-sm text-foreground placeholder:text-muted-foreground",
                "transition-colors focus:border-score focus:outline-none focus:ring-1 focus:ring-score",
                "disabled:opacity-50"
              )}
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                "bg-score text-white transition-colors hover:bg-score/90",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {streaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
