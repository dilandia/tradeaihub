/**
 * Tipos e queries para trading_accounts.
 * Roda server-side apenas.
 */
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type DbTradingAccount = {
  id: string;
  user_id: string;
  account_name: string;
  platform: "MT4" | "MT5";
  broker: string;
  server: string;
  login: string;
  password_encrypted: string;
  password_type: "investor" | "master";
  metaapi_account_id: string | null;
  status: "connected" | "disconnected" | "syncing" | "error";
  last_sync_at: string | null;
  sync_interval_minutes: number;
  auto_sync_enabled: boolean;
  profit_calc_method: "FIFO" | "LIFO";
  balance: number;
  equity: number;
  currency: string;
  leverage: number | null;
  error_message: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Tipo seguro para enviar ao client (sem password_encrypted) */
export type TradingAccountSafe = Omit<DbTradingAccount, "password_encrypted">;

/** Busca todas as contas do usuário (excludes soft-deleted via RLS + explicit filter) - cached per request */
export const getUserTradingAccounts = cache(async (): Promise<TradingAccountSafe[]> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("trading_accounts")
    .select(
      "id, user_id, account_name, platform, broker, server, login, " +
        "password_type, metaapi_account_id, status, last_sync_at, " +
        "sync_interval_minutes, auto_sync_enabled, profit_calc_method, " +
        "balance, equity, currency, leverage, error_message, is_active, " +
        "created_at, updated_at, deleted_at"
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as unknown as TradingAccountSafe[];
});

/** Busca uma conta específica (com senha para backend, excludes soft-deleted) */
export async function getTradingAccountFull(
  accountId: string
): Promise<DbTradingAccount | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("trading_accounts")
    .select("*")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (error) return null;
  return data as unknown as DbTradingAccount;
}
