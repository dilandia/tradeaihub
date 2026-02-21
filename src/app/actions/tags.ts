"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/* ─── Types ─── */

export type UserTag = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  created_at: string;
  trade_count: number;
};

/* ─── Queries ─── */

export async function getUserTags(): Promise<UserTag[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Single RPC call: returns tags with counts + analytics
  // Query 1: ← get_user_tags_with_counts (consolidates previous 2 queries)
  const { data: tags, error } = await supabase.rpc(
    "get_user_tags_with_counts",
    { p_user_id: user.id }
  );

  if (error) {
    console.error("[tags] getUserTags error:", error.message);
    return [];
  }

  if (!tags) return [];

  return tags.map((t: any) => ({
    id: t.id,
    name: t.name,
    color: t.color ?? "#7C3AED",
    description: t.description ?? null,
    created_at: t.created_at,
    trade_count: t.trade_count ?? 0,
  }));
}

/* ─── Mutations ─── */

export async function createTag(
  name: string,
  color: string,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  if (!name.trim()) return { success: false, error: "Nome é obrigatório." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  const { error } = await supabase.from("user_tags").insert({
    user_id: user.id,
    name: name.trim(),
    color,
    description: description?.trim() || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Já existe uma tag com esse nome." };
    }
    console.error("[tags] createTag:", error.message);
    return { success: false, error: "Erro ao criar tag. Tente novamente." };
  }

  revalidatePath("/settings/tags");
  return { success: true };
}

export async function updateTag(
  id: string,
  name: string,
  color: string,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  if (!name.trim()) return { success: false, error: "Nome é obrigatório." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  // Buscar nome antigo para renomear nos trades
  const { data: oldTag } = await supabase
    .from("user_tags")
    .select("name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!oldTag) return { success: false, error: "Tag não encontrada." };

  const { error } = await supabase
    .from("user_tags")
    .update({
      name: name.trim(),
      color,
      description: description?.trim() || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Já existe uma tag com esse nome." };
    }
    console.error("[tags] updateTag:", error.message);
    return { success: false, error: "Erro ao atualizar tag. Tente novamente." };
  }

  // Renomear tag nos trades se o nome mudou (W2-01: bulk RPC, eliminates N+1)
  if (oldTag.name !== name.trim()) {
    const { error: rpcError } = await supabase.rpc("bulk_update_trade_tags", {
      p_user_id: user.id,
      p_old_tag: oldTag.name,
      p_new_tag: name.trim(),
    });

    if (rpcError) {
      console.error("[tags] updateTag bulk_update_trade_tags:", rpcError.message);
      // Tag metadata already updated; log but don't fail the operation
    }
  }

  revalidatePath("/settings/tags");
  return { success: true };
}

export async function deleteTag(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  // Buscar nome para remover dos trades
  const { data: tag } = await supabase
    .from("user_tags")
    .select("name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!tag) return { success: false, error: "Tag não encontrada." };

  // Remover tag dos trades (W2-01: bulk RPC, eliminates N+1)
  const { error: rpcError } = await supabase.rpc("bulk_update_trade_tags", {
    p_user_id: user.id,
    p_old_tag: tag.name,
    // p_new_tag omitted (defaults to NULL = delete mode)
  });

  if (rpcError) {
    console.error("[tags] deleteTag bulk_update_trade_tags:", rpcError.message);
    // Continue with tag deletion even if trade update fails
  }

  // Deletar a tag
  const { error } = await supabase
    .from("user_tags")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[tags] deleteTag:", error.message);
    return { success: false, error: "Erro ao deletar tag. Tente novamente." };
  }

  revalidatePath("/settings/tags");
  return { success: true };
}
