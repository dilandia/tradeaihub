"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/* ─── Types ─── */

export type Strategy = {
  id: string;
  name: string;
  description: string | null;
  entry_rules: string[];
  exit_rules: string[];
  timeframes: string[];
  pairs: string[];
  risk_per_trade: number | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StrategyFormData = {
  name: string;
  description?: string;
  entry_rules?: string[];
  exit_rules?: string[];
  timeframes?: string[];
  pairs?: string[];
  risk_per_trade?: number | null;
  color?: string;
};

/* ─── Queries ─── */

export async function getStrategies(): Promise<Strategy[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("strategies")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[strategies] getStrategies error:", error.message);
    return [];
  }

  if (!data) return [];

  return data.map((s: Record<string, unknown>) => ({
    id: s.id as string,
    name: s.name as string,
    description: (s.description as string) ?? null,
    entry_rules: (s.entry_rules as string[]) ?? [],
    exit_rules: (s.exit_rules as string[]) ?? [],
    timeframes: (s.timeframes as string[]) ?? [],
    pairs: (s.pairs as string[]) ?? [],
    risk_per_trade: (s.risk_per_trade as number) ?? null,
    color: (s.color as string) ?? "#6366f1",
    is_active: (s.is_active as boolean) ?? true,
    created_at: s.created_at as string,
    updated_at: s.updated_at as string,
  }));
}

/* ─── Mutations ─── */

export async function createStrategy(
  formData: StrategyFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!formData.name?.trim()) {
    return { success: false, error: "Name is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data, error } = await supabase
    .from("strategies")
    .insert({
      user_id: user.id,
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      entry_rules: formData.entry_rules?.filter((r) => r.trim()) ?? [],
      exit_rules: formData.exit_rules?.filter((r) => r.trim()) ?? [],
      timeframes: formData.timeframes?.filter((t) => t.trim()) ?? [],
      pairs: formData.pairs?.filter((p) => p.trim()) ?? [],
      risk_per_trade: formData.risk_per_trade ?? null,
      color: formData.color ?? "#6366f1",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[strategies] createStrategy:", error.message);
    return { success: false, error: "Failed to create strategy." };
  }

  revalidatePath("/strategies");
  return { success: true, id: data?.id };
}

export async function updateStrategy(
  id: string,
  formData: Partial<StrategyFormData>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (formData.name !== undefined) {
    if (!formData.name.trim()) return { success: false, error: "Name is required." };
    updateData.name = formData.name.trim();
  }
  if (formData.description !== undefined) {
    updateData.description = formData.description?.trim() || null;
  }
  if (formData.entry_rules !== undefined) {
    updateData.entry_rules = formData.entry_rules.filter((r) => r.trim());
  }
  if (formData.exit_rules !== undefined) {
    updateData.exit_rules = formData.exit_rules.filter((r) => r.trim());
  }
  if (formData.timeframes !== undefined) {
    updateData.timeframes = formData.timeframes.filter((t) => t.trim());
  }
  if (formData.pairs !== undefined) {
    updateData.pairs = formData.pairs.filter((p) => p.trim());
  }
  if (formData.risk_per_trade !== undefined) {
    updateData.risk_per_trade = formData.risk_per_trade;
  }
  if (formData.color !== undefined) {
    updateData.color = formData.color;
  }

  const { error } = await supabase
    .from("strategies")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[strategies] updateStrategy:", error.message);
    return { success: false, error: "Failed to update strategy." };
  }

  revalidatePath("/strategies");
  return { success: true };
}

export async function deleteStrategy(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  // Soft delete
  const { error } = await supabase
    .from("strategies")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[strategies] deleteStrategy:", error.message);
    return { success: false, error: "Failed to delete strategy." };
  }

  revalidatePath("/strategies");
  return { success: true };
}
