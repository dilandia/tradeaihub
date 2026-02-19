/**
 * Tipos e queries para trading_accounts.
 * Roda server-side apenas.
 */
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
};

/** Tipo seguro para enviar ao client (sem password_encrypted) */
export type TradingAccountSafe = Omit<DbTradingAccount, "password_encrypted">;

/** Busca todas as contas do usuário */
export async function getUserTradingAccounts(): Promise<TradingAccountSafe[]> {
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
        "created_at, updated_at"
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as unknown as TradingAccountSafe[];
}

/** Busca uma conta específica (com senha para backend) */
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
    .single();

  if (error) return null;
  return data as unknown as DbTradingAccount;
}
