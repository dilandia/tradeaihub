"use server";

import { createClient } from "@/lib/supabase/server";

/* ─── Types ─── */

export type ProfileData = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  timezone: string;
  preferred_currency: string;
  language: string;
  created_at: string;
  updated_at: string;
};

export type ProfileUpdatePayload = {
  full_name?: string;
  phone?: string;
  bio?: string;
  timezone?: string;
  preferred_currency?: string;
  language?: string;
};

/* ─── Queries ─── */

export async function getProfile(): Promise<ProfileData | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const user = session.user;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: user.email ?? data.email ?? "",
    full_name: data.full_name ?? null,
    avatar_url: data.avatar_url ?? null,
    phone: data.phone ?? null,
    bio: data.bio ?? null,
    timezone: data.timezone ?? "server",
    preferred_currency: data.preferred_currency ?? "USD",
    language: data.language ?? "pt-BR",
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/* ─── Mutations ─── */

export async function updateProfile(
  payload: ProfileUpdatePayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return { success: false, error: "Não autenticado." };
  const user = session.user;

  const { error } = await supabase
    .from("profiles")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[updateProfile]", error.message);
    return { success: false, error: "Erro ao atualizar perfil. Tente novamente." };
  }

  // Atualizar metadata do auth também (fire-and-forget para não bloquear)
  if (payload.full_name !== undefined) {
    supabase.auth.updateUser({
      data: { full_name: payload.full_name },
    }).catch(() => { /* non-critical */ });
  }

  return { success: true };
}

export async function updateAvatar(
  avatarUrl: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return { success: false, error: "Não autenticado." };
  const user = session.user;

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    console.error("[updateAvatar]", error.message);
    return { success: false, error: "Erro ao atualizar avatar. Tente novamente." };
  }

  return { success: true };
}

export async function deleteAvatar(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return { success: false, error: "Não autenticado." };
  const user = session.user;

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    console.error("[deleteAvatar]", error.message);
    return { success: false, error: "Erro ao remover avatar. Tente novamente." };
  }

  return { success: true };
}
