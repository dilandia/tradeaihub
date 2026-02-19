"use client";

import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { PlanGateError } from "@/lib/ai/plan-gate-error";

function handleAiResponse<T>(res: Response, data: { error?: string; code?: string }, getPayload: () => T): T {
  if (!res.ok && res.status === 403 && data.code === "plan") {
    throw new PlanGateError(data.error ?? "planErrors.aiFree", "plan", data.error ?? "planErrors.aiFree");
  }
  if (!res.ok && res.status === 403 && data.code === "credits") {
    throw new PlanGateError(data.error ?? "planErrors.creditsZero", "credits", data.error ?? "planErrors.creditsZero");
  }
  if (!res.ok) throw new Error(data.error ?? "Error");
  return getPayload();
}

export function useAiApiParams() {
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const importId = searchParams.get("import") ?? undefined;
  const accountId = searchParams.get("account") ?? undefined;
  return { importId, accountId, locale: locale ?? "en", period: "all" };
}

export async function fetchAiReportSummary(params: {
  importId?: string;
  accountId?: string;
  locale?: string;
  period?: string;
  reportType?: string;
}): Promise<string> {
  const res = await fetch("/api/ai/report-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reportType: params.reportType ?? "Overview",
      importId: params.importId ?? null,
      accountId: params.accountId ?? null,
      period: params.period ?? "all",
      locale: params.locale ?? "en",
    }),
  });
  const data = await res.json();
  return handleAiResponse(res, data, () => {
    const raw = data.summary ?? "";
    return typeof raw === "string" ? raw : JSON.stringify(raw);
  });
}

export async function fetchAiInsights(params: {
  importId?: string;
  accountId?: string;
  locale?: string;
  period?: string;
}): Promise<string> {
  const res = await fetch("/api/ai/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      importId: params.importId ?? null,
      accountId: params.accountId ?? null,
      period: params.period ?? "all",
      locale: params.locale ?? "en",
    }),
  });
  const data = await res.json();
  return handleAiResponse(res, data, () => {
    const raw = data.insights ?? "";
    return typeof raw === "string" ? raw : JSON.stringify(raw);
  });
}

export async function fetchAiPatterns(params: {
  importId?: string;
  accountId?: string;
  locale?: string;
  period?: string;
}): Promise<string> {
  const res = await fetch("/api/ai/patterns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      importId: params.importId ?? null,
      accountId: params.accountId ?? null,
      period: params.period ?? "all",
      locale: params.locale ?? "en",
    }),
  });
  const data = await res.json();
  return handleAiResponse(res, data, () => {
    const raw = data.insights ?? "";
    return typeof raw === "string" ? raw : JSON.stringify(raw);
  });
}

export async function fetchAiTakerzScore(params: {
  importId?: string;
  accountId?: string;
  locale?: string;
  period?: string;
}): Promise<string> {
  const res = await fetch("/api/ai/takerz-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      importId: params.importId ?? null,
      accountId: params.accountId ?? null,
      period: params.period ?? "all",
      locale: params.locale ?? "en",
    }),
  });
  const data = await res.json();
  return handleAiResponse(res, data, () => {
    const raw = data.insights ?? "";
    return typeof raw === "string" ? raw : JSON.stringify(raw);
  });
}

export type CopilotStreamParams = {
  message: string;
  conversationId?: string;
  importId?: string;
  accountId?: string;
  locale?: string;
  period?: string;
};

/** Envia mensagem ao Copilot e retorna stream de texto + conversationId. */
export async function fetchAiCopilotStream(
  params: CopilotStreamParams,
  onChunk: (chunk: string) => void
): Promise<{ content: string; conversationId: string }> {
  const res = await fetch("/api/ai/copilot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: params.message,
      conversationId: params.conversationId ?? null,
      importId: params.importId ?? null,
      accountId: params.accountId ?? null,
      period: params.period ?? "all",
      locale: params.locale ?? "en",
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 403 && data.code === "plan") {
      throw new PlanGateError(data.error ?? "planErrors.aiFree", "plan", data.error ?? "planErrors.aiFree");
    }
    if (res.status === 403 && data.code === "credits") {
      throw new PlanGateError(data.error ?? "planErrors.creditsZero", "credits", data.error ?? "planErrors.creditsZero");
    }
    throw new Error(data.error ?? "Error");
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let content = "";
  const conversationId = res.headers.get("X-Conversation-Id") ?? "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    content += chunk;
    onChunk(chunk);
  }

  return { content, conversationId };
}

/** Fallback: Copilot sem streaming (para compatibilidade). Prefira fetchAiCopilotStream. */
export async function fetchAiCopilot(params: {
  message: string;
  importId?: string;
  accountId?: string;
  locale?: string;
  period?: string;
}): Promise<string> {
  let content = "";
  await fetchAiCopilotStream(
    { ...params, period: params.period ?? "all", locale: params.locale ?? "en" },
    (chunk) => { content += chunk; }
  );
  return content;
}

export type ContextualSuggestion = { queryKey: string; reasonKey: string; priority: number };

export async function fetchCopilotSuggestions(params: {
  importId?: string;
  accountId?: string;
  period?: string;
}): Promise<ContextualSuggestion[]> {
  const q = new URLSearchParams();
  if (params.importId) q.set("import", params.importId);
  if (params.accountId) q.set("account", params.accountId);
  if (params.period) q.set("period", params.period ?? "all");
  const res = await fetch(`/api/ai/copilot/suggestions?${q}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.suggestions ?? [];
}

export type CopilotConversation = {
  id: string;
  import_id: string | null;
  account_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchCopilotUpdateConversationTitle(
  id: string,
  title: string
): Promise<boolean> {
  const res = await fetch(`/api/ai/copilot/conversations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return res.ok;
}

export async function fetchCopilotConversations(): Promise<CopilotConversation[]> {
  const res = await fetch("/api/ai/copilot/conversations");
  if (!res.ok) return [];
  const data = await res.json();
  return data.conversations ?? [];
}

export type CopilotMessage = { id: string; role: string; content: string; created_at: string };

export async function fetchCopilotConversation(id: string): Promise<CopilotMessage[]> {
  const res = await fetch(`/api/ai/copilot/conversations/${id}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.messages ?? [];
}

export async function fetchAiRisk(params: {
  importId?: string;
  accountId?: string;
  locale?: string;
  period?: string;
}): Promise<string> {
  const res = await fetch("/api/ai/risk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      importId: params.importId ?? null,
      accountId: params.accountId ?? null,
      period: params.period ?? "all",
      locale: params.locale ?? "en",
    }),
  });
  const data = await res.json();
  return handleAiResponse(res, data, () => {
    const raw = data.insights ?? "";
    return typeof raw === "string" ? raw : JSON.stringify(raw);
  });
}
