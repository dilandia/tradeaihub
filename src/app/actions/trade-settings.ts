"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/* ─── Types ─── */

export type TradePreferences = {
  default_view_mode: string;
  default_time_range: string;
  profit_calc_method: string;
  default_chart_type: string;
  show_weekends: boolean;
  week_start: string;
  risk_per_trade: number;
  default_risk_reward: number;
  max_daily_loss: number | null;
  max_daily_trades: number | null;
  trading_session: string;
  session_start_hour: number;
  session_end_hour: number;
};

const DEFAULTS: TradePreferences = {
  default_view_mode: "dollar",
  default_time_range: "30d",
  profit_calc_method: "FIFO",
  default_chart_type: "area",
  show_weekends: false,
  week_start: "monday",
  risk_per_trade: 1.0,
  default_risk_reward: 2.0,
  max_daily_loss: null,
  max_daily_trades: null,
  trading_session: "all",
  session_start_hour: 0,
  session_end_hour: 23,
};

/* ─── Queries ─── */

export async function getTradePreferences(): Promise<TradePreferences> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULTS;

  const { data } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!data) return DEFAULTS;

  return {
    default_view_mode: data.default_view_mode ?? DEFAULTS.default_view_mode,
    default_time_range: data.default_time_range ?? DEFAULTS.default_time_range,
    profit_calc_method: data.profit_calc_method ?? DEFAULTS.profit_calc_method,
    default_chart_type: data.default_chart_type ?? DEFAULTS.default_chart_type,
    show_weekends: data.show_weekends ?? DEFAULTS.show_weekends,
    week_start: data.week_start ?? DEFAULTS.week_start,
    risk_per_trade: Number(data.risk_per_trade ?? DEFAULTS.risk_per_trade),
    default_risk_reward: Number(data.default_risk_reward ?? DEFAULTS.default_risk_reward),
    max_daily_loss: data.max_daily_loss ? Number(data.max_daily_loss) : null,
    max_daily_trades: data.max_daily_trades ?? null,
    trading_session: data.trading_session ?? DEFAULTS.trading_session,
    session_start_hour: data.session_start_hour ?? DEFAULTS.session_start_hour,
    session_end_hour: data.session_end_hour ?? DEFAULTS.session_end_hour,
  };
}

/* ─── Mutations ─── */

export async function updateTradePreferences(
  payload: Partial<TradePreferences>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  const { error } = await supabase
    .from("user_preferences")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (error) {
    // Caso não exista, criar
    const { error: insertError } = await supabase
      .from("user_preferences")
      .insert({ user_id: user.id, ...payload });

    if (insertError) return { success: false, error: insertError.message };
  }

  revalidatePath("/settings/trade-settings");
  return { success: true };
}
