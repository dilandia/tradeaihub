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

  const { data: tags } = await supabase
    .from("user_tags")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (!tags) return [];

  // Buscar contagens via RPC (Phase 2: N+1 Prevention)
  // Antes: 1 query + fetch todas trades + loop CPU
  // Agora: 2 queries (tags + RPC com agregação na DB)
  const { data: tagCounts } = await supabase.rpc(
    "get_user_tag_counts",
    { p_user_id: user.id }
  );

  const countMap = new Map<string, number>();
  if (tagCounts) {
    for (const row of tagCounts as Array<{ tag_name: string; tag_count: number }>) {
      countMap.set(row.tag_name, row.tag_count);
    }
  }

  return tags.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color ?? "#7C3AED",
    description: t.description ?? null,
    created_at: t.created_at,
    trade_count: countMap.get(t.name) ?? 0,
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

  // Renomear tag nos trades se o nome mudou (only active trades)
  if (oldTag.name !== name.trim()) {
    const { data: trades } = await supabase
      .from("trades")
      .select("id, tags")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .contains("tags", [oldTag.name]);

    if (trades) {
      for (const t of trades) {
        const updated = (t.tags as string[]).map((tag: string) =>
          tag === oldTag.name ? name.trim() : tag
        );
        await supabase.from("trades").update({ tags: updated }).eq("id", t.id);
      }
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

  // Remover tag dos trades (only active trades)
  const { data: trades } = await supabase
    .from("trades")
    .select("id, tags")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .contains("tags", [tag.name]);

  if (trades) {
    for (const t of trades) {
      const updated = (t.tags as string[]).filter(
        (tg: string) => tg !== tag.name
      );
      await supabase.from("trades").update({ tags: updated }).eq("id", t.id);
    }
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
