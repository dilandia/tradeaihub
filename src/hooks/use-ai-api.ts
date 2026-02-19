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
