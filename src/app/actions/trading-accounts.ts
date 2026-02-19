"use server";

import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";
import type { TradingAccountSafe } from "@/lib/trading-accounts";
import { getPlanInfo } from "@/lib/plan";

type ActionResult = {
  success: boolean;
  error?: string;
  account?: TradingAccountSafe;
};

/* ─── Campos sem password_encrypted ─── */
const SAFE_SELECT =
  "id, user_id, account_name, platform, broker, server, login, " +
  "password_type, metaapi_account_id, status, last_sync_at, " +
  "sync_interval_minutes, auto_sync_enabled, profit_calc_method, " +
  "balance, equity, currency, leverage, error_message, is_active, " +
  "created_at, updated_at";

/* ────────────────── CREATE ────────────────── */

type CreateInput = {
  account_name: string;
  platform: "MT4" | "MT5";
  broker: string;
  server: string;
  login: string;
  password: string;
  password_type: "investor" | "master";
  profit_calc_method: "FIFO" | "LIFO";
  sync_interval_minutes: number;
  auto_sync_enabled: boolean;
};

export async function createTradingAccount(
  input: CreateInput
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  const planInfo = await getPlanInfo(user.id);
  if (!planInfo?.canUseMetaApi) {
    return { success: false, error: "planErrors.linkAccountFree" };
  }

  const { count } = await supabase
    .from("trading_accounts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true)
    .not("metaapi_account_id", "is", null);

  if ((count ?? 0) >= planInfo.maxActiveMetaApiAccounts) {
    return { success: false, error: "planErrors.maxAccountsPro" };
  }

  try {
    const passwordEncrypted = encrypt(input.password);

    const { data, error } = await supabase
      .from("trading_accounts")
      .insert({
        user_id: user.id,
        account_name: input.account_name,
        platform: input.platform,
        broker: input.broker,
        server: input.server,
        login: input.login,
        password_encrypted: passwordEncrypted,
        password_type: input.password_type,
        profit_calc_method: input.profit_calc_method,
        sync_interval_minutes: input.sync_interval_minutes,
        auto_sync_enabled: input.auto_sync_enabled,
        status: "disconnected",
      })
      .select(SAFE_SELECT)
      .single();

    if (error) {
      console.error("[createTradingAccount]", error.message);
      return { success: false, error: "Erro ao criar conta." };
    }

    return { success: true, account: data as unknown as TradingAccountSafe };
  } catch (err) {
    console.error("[createTradingAccount]", err);
    return { success: false, error: "Erro inesperado." };
  }
}

/* ────────────────── UPDATE ────────────────── */

type UpdateInput = {
  id: string;
  account_name: string;
  platform: "MT4" | "MT5";
  broker: string;
  server: string;
  login: string;
  password?: string; // undefined = não alterar
  password_type: "investor" | "master";
  profit_calc_method: "FIFO" | "LIFO";
  sync_interval_minutes: number;
  auto_sync_enabled: boolean;
};

export async function updateTradingAccount(
  input: UpdateInput
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  try {
    const updates: Record<string, unknown> = {
      account_name: input.account_name,
      platform: input.platform,
      broker: input.broker,
      server: input.server,
      login: input.login,
      password_type: input.password_type,
      profit_calc_method: input.profit_calc_method,
      sync_interval_minutes: input.sync_interval_minutes,
      auto_sync_enabled: input.auto_sync_enabled,
      updated_at: new Date().toISOString(),
    };

    // Se nova senha informada, criptografar
    if (input.password) {
      updates.password_encrypted = encrypt(input.password);
      // Resetar metaapi_account_id para forçar re-criação no MetaApi
      updates.metaapi_account_id = null;
    }

    const { data, error } = await supabase
      .from("trading_accounts")
      .update(updates)
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select(SAFE_SELECT)
      .single();

    if (error) {
      console.error("[updateTradingAccount]", error.message);
      return { success: false, error: "Erro ao atualizar conta." };
    }

    return { success: true, account: data as unknown as TradingAccountSafe };
  } catch (err) {
    console.error("[updateTradingAccount]", err);
    return { success: false, error: "Erro inesperado." };
  }
}

/* ────────────────── DELETE ────────────────── */

export async function deleteTradingAccount(
  accountId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  try {
    // 1) Deletar trades vinculados
    await supabase
      .from("trades")
      .delete()
      .eq("trading_account_id", accountId)
      .eq("user_id", user.id);

    // 2) Deletar conta
    const { error } = await supabase
      .from("trading_accounts")
      .delete()
      .eq("id", accountId)
      .eq("user_id", user.id);

    if (error) {
      console.error("[deleteTradingAccount]", error.message);
      return { success: false, error: "Erro ao deletar conta." };
    }

    return { success: true };
  } catch (err) {
    console.error("[deleteTradingAccount]", err);
    return { success: false, error: "Erro inesperado." };
  }
}

/* ────────────────── CLEAR TRADES ────────────────── */

export async function clearTradingAccountTrades(
  accountId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  try {
    const { error } = await supabase
      .from("trades")
      .delete()
      .eq("trading_account_id", accountId)
      .eq("user_id", user.id);

    if (error) {
      console.error("[clearTradingAccountTrades]", error.message);
      return { success: false, error: "Erro ao limpar trades." };
    }

    // Resetar balance/equity
    await supabase
      .from("trading_accounts")
      .update({
        balance: 0,
        equity: 0,
        last_sync_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountId)
      .eq("user_id", user.id);

    return { success: true };
  } catch (err) {
    console.error("[clearTradingAccountTrades]", err);
    return { success: false, error: "Erro inesperado." };
  }
}

/* ────────────────── SYNC ────────────────── */

export async function syncTradingAccount(
  accountId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  try {
    // Marca como syncing
    await supabase
      .from("trading_accounts")
      .update({ status: "syncing", updated_at: new Date().toISOString() })
      .eq("id", accountId)
      .eq("user_id", user.id);

    const { syncAccountWithMetaApi } = await import("@/lib/metaapi-sync");
    const result = await syncAccountWithMetaApi(accountId, user.id);

    if (result.success) {
      // Busca conta atualizada
      const { data: updated } = await supabase
        .from("trading_accounts")
        .select(SAFE_SELECT)
        .eq("id", accountId)
        .eq("user_id", user.id)
        .single();

      return {
        success: true,
        account: updated as unknown as TradingAccountSafe,
      };
    } else {
      // Marca como erro
      await supabase
        .from("trading_accounts")
        .update({
          status: "error",
          error_message: result.error,
          updated_at: new Date().toISOString(),
        })
        .eq("id", accountId)
        .eq("user_id", user.id);

      // Busca conta atualizada
      const { data: updated } = await supabase
        .from("trading_accounts")
        .select(SAFE_SELECT)
        .eq("id", accountId)
        .eq("user_id", user.id)
        .single();

      return {
        success: false,
        error: result.error,
        account: updated as unknown as TradingAccountSafe,
      };
    }
  } catch (err) {
    console.error("[syncTradingAccount]", err);
    return { success: false, error: "Erro inesperado no sync." };
  }
}
