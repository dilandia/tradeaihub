"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseNumber, parseExcel, parseCsv, parseHtml } from "@/lib/parsers";
import type { TradeInsert } from "@/lib/parsers";
import { getPlanInfo } from "@/lib/plan";
import {
  CreateTradeSchema,
  UpdateTradeSchema,
  validateTradeFormData,
} from "@/lib/validation/trade-schemas";

/* ─────────────────────────────────────────────
 * Criar trade manualmente
 * ───────────────────────────────────────────── */

export async function createTrade(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  // TDW3-03: Validate FormData with Zod schema
  const validation = validateTradeFormData(formData);
  if (!validation.success) {
    return { error: validation.error || "Dados inválidos." };
  }

  const { trade_date, pair, entry_price, exit_price, pips: inputPips, is_win, risk_reward, tags, notes } = validation.data!;

  let pips = inputPips;
  if (pips === 0 && entry_price !== 0 && exit_price !== 0) {
    pips = Math.abs(exit_price - entry_price) * 10000;
    if (pair.includes("JPY")) pips *= 0.01;
  }

  const { error } = await supabase.from("trades").insert({
    user_id: user.id,
    trade_date,
    pair,
    entry_price,
    exit_price,
    pips: is_win ? Math.abs(pips) : -Math.abs(pips),
    is_win,
    risk_reward: risk_reward ?? null,
    tags: tags.length ? tags : [],
    notes: notes ?? null,
  });

  if (error) {
    console.error("[trades] addTrade:", error.message);
    return { error: "Erro ao salvar trade. Tente novamente." };
  }
  revalidatePath("/", "layout");
  revalidatePath("/import");
  revalidateTag("trades");
  return {};
}

/* ─────────────────────────────────────────────
 * Importar trades de arquivo (CSV / Excel / HTML)
 * ───────────────────────────────────────────── */

export async function importTradesFromFile(formData: FormData): Promise<{
  error?: string;
  imported?: number;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const planInfo = await getPlanInfo(user.id);
  if (planInfo) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [{ count: totalManual }, { count: importsThisMonth }] = await Promise.all([
      supabase
        .from("import_summaries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("deleted_at", null),
      supabase
        .from("import_summaries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .gte("created_at", startOfMonth.toISOString()),
    ]);

    if ((totalManual ?? 0) >= planInfo.maxManualAccounts) {
      return { error: "planErrors.maxManualFree" };
    }
    if ((importsThisMonth ?? 0) >= planInfo.importLimitPerMonth) {
      return { error: "planErrors.importLimit" };
    }
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Selecione um arquivo." };

  const name = file.name.toLowerCase();
  const isCsv = name.endsWith(".csv");
  const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls");
  const isHtml = name.endsWith(".html") || name.endsWith(".htm");

  if (!isCsv && !isExcel && !isHtml) {
    return { error: "Formato não suportado. Use .csv, .xlsx, .xls, .html ou .htm." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let trades: TradeInsert[] = [];
  let summary = null;

  if (isHtml) {
    const result = parseHtml(buffer.toString("utf-8"));
    if (result.htmlJsonOnly) {
      return {
        error: "Este HTML é um relatório visual do broker (dashboard) sem trades individuais. Use o Excel (.xlsx) exportado do MT5.",
      };
    }
    trades = result.trades;
    summary = result.summary;
  } else if (isCsv) {
    const result = parseCsv(buffer.toString("utf-8"));
    trades = result.trades;
    summary = result.summary;
  } else {
    const result = parseExcel(buffer);
    trades = result.trades;
    summary = result.summary;
  }

  if (trades.length === 0) {
    return { error: "Nenhum trade válido encontrado. Certifique-se de que o arquivo contém Time, Symbol, Price e Profit." };
  }

  // 1) Sempre criar registro de importação (com métricas se disponíveis)
  const importPayload: Record<string, unknown> = {
    user_id: user.id,
    source_filename: file.name,
    imported_trades_count: trades.length,
  };

  if (summary) {
    Object.assign(importPayload, summary);
  }

  const { data: summaryRow, error: sumErr } = await supabase
    .from("import_summaries")
    .insert(importPayload)
    .select("id")
    .single();

  if (sumErr) {
    console.error("[trades] Erro ao salvar import:", sumErr.message);
    return { error: "Erro ao registrar importação. Tente novamente." };
  }

  const importId = summaryRow.id;

  // 2) Inserir trades vinculados à importação
  const toInsert = trades.map((t) => ({
    user_id: user.id,
    trade_date: t.trade_date,
    pair: t.pair,
    entry_price: t.entry_price,
    exit_price: t.exit_price,
    pips: t.pips,
    is_win: t.is_win,
    risk_reward: t.risk_reward ?? null,
    tags: t.tags ?? [],
    notes: t.notes ?? null,
    import_id: importId,
    entry_time: t.entry_time ?? null,
    exit_time: t.exit_time ?? null,
    duration_minutes: t.duration_minutes ?? null,
    profit_dollar: t.profit_dollar ?? null,
  }));

  const { error } = await supabase.from("trades").insert(toInsert);
  if (error) {
    console.error("[trades] insert:", error.message);
    return { error: "Erro ao importar trades. Tente novamente." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/import");
  revalidateTag("trades");
  return { imported: trades.length };
}

/* ─────────────────────────────────────────────
 * TDR-12: Soft-delete a single trade
 * Sets deleted_at instead of permanent DELETE
 * ───────────────────────────────────────────── */

export async function softDeleteTrade(tradeId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("trades")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", tradeId)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) {
    console.error("[trades] softDeleteTrade:", error.message);
    return { error: "Erro ao deletar trade. Tente novamente." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/trades");
  revalidateTag("trades");
  return {};
}

/* ─────────────────────────────────────────────
 * TDR-12: Restore a soft-deleted trade
 * Clears deleted_at to make the trade active again
 * ───────────────────────────────────────────── */

export async function restoreTrade(tradeId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  // Use admin client to bypass RLS (deleted trades are hidden by SELECT policy)
  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const { createClient: createAdmin } = await import("@supabase/supabase-js");
  const admin = createAdmin(adminUrl, adminKey);

  // Verify ownership before restoring
  const { data: trade, error: fetchErr } = await admin
    .from("trades")
    .select("id, user_id, deleted_at")
    .eq("id", tradeId)
    .single();

  if (fetchErr || !trade) {
    return { error: "Trade não encontrado." };
  }

  if (trade.user_id !== user.id) {
    return { error: "Sem permissão para restaurar este trade." };
  }

  if (!trade.deleted_at) {
    return { error: "Este trade não está deletado." };
  }

  const { error } = await admin
    .from("trades")
    .update({ deleted_at: null })
    .eq("id", tradeId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[trades] restoreTrade:", error.message);
    return { error: "Erro ao restaurar trade. Tente novamente." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/trades");
  revalidateTag("trades");
  return {};
}

/* ─────────────────────────────────────────────
 * Soft-delete importação e todos os trades associados (TDR-12)
 * ───────────────────────────────────────────── */

export async function deleteImport(importId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const now = new Date().toISOString();

  // 1) Soft-delete trades vinculados pelo import_id
  const { error: tradesErr } = await supabase
    .from("trades")
    .update({ deleted_at: now })
    .eq("import_id", importId)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (tradesErr) {
    console.error("[trades] deleteImport trades:", tradesErr.message);
    return { error: "Erro ao remover trades. Tente novamente." };
  }

  // 2) Soft-delete o registro de importação
  const { error: importErr } = await supabase
    .from("import_summaries")
    .update({ deleted_at: now })
    .eq("id", importId)
    .eq("user_id", user.id);

  if (importErr) {
    console.error("[trades] deleteImport summary:", importErr.message);
    return { error: "Erro ao remover importação. Tente novamente." };
  }

  // 3) Soft-delete trades órfãos (sem import_id e sem trading_account_id)
  await supabase
    .from("trades")
    .update({ deleted_at: now })
    .is("import_id", null)
    .is("trading_account_id", null)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  revalidatePath("/", "layout");
  revalidatePath("/import");
  revalidateTag("trades");
  return {};
}

/* ─────────────────────────────────────────────
 * Atualizar notes e tags de um trade
 * ───────────────────────────────────────────── */

export async function updateTradeNotesAndTags(
  tradeId: string,
  notes: string | null,
  tags: string[]
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  // TDW3-03: Validate inputs with Zod schema
  const validation = UpdateTradeSchema.safeParse({
    tradeId,
    notes,
    tags,
  });

  if (!validation.success) {
    const errorMessages = validation.error.issues
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join("; ");
    return { error: errorMessages };
  }

  const { tradeId: validTradeId, notes: validNotes, tags: validTags } = validation.data;

  const { error } = await supabase
    .from("trades")
    .update({
      notes: validNotes?.trim() || null,
      tags: validTags?.length ? validTags : [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", validTradeId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[trades] updateTradeNotesAndTags:", error.message);
    return { error: "Erro ao atualizar trade. Tente novamente." };
  }
  revalidatePath("/trades");
  revalidatePath("/", "layout");
  revalidateTag("trades");
  return {};
}

/* ─────────────────────────────────────────────
 * W2-P2: Get trades with enriched tag metadata
 * Eliminates N+1 when displaying trades with tag details
 * ───────────────────────────────────────────── */

export type TradeWithTagDetails = {
  id: string;
  trade_date: string;
  pair: string;
  entry_price: number;
  exit_price: number;
  pips: number;
  is_win: boolean;
  risk_reward: number | null;
  tags: string[];
  notes: string | null;
  import_id: string | null;
  trading_account_id: string | null;
  entry_time: string | null;
  exit_time: string | null;
  duration_minutes: number | null;
  profit_dollar: number | null;
  created_at: string;
  updated_at: string;
  tag_details: Array<{
    name: string;
    color: string;
    description: string | null;
  }>;
};

/**
 * Get trades with enriched tag metadata (color, description) in single query.
 * Eliminates N+1 when displaying trades with tag details.
 *
 * Before: 50 trades = 1 query + loop to fetch tag metadata (50+ queries)
 * After:  50 trades = 1 RPC call returns everything
 */
export async function getTradesWithTags(
  importId?: string,
  accountId?: string
): Promise<TradeWithTagDetails[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Single RPC: returns trades with tag_details enrichment
  const { data: trades, error } = await supabase.rpc(
    "get_trades_with_tags",
    {
      p_user_id: user.id,
      p_import_id: importId || null,
      p_account_id: accountId || null,
    }
  );

  if (error) {
    console.error("[trades] getTradesWithTags error:", error.message);
    return [];
  }

  if (!trades) return [];

  return trades as TradeWithTagDetails[];
}
