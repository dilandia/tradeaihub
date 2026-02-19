"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/* ─── Change Password ─── */

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "A nova senha deve ter pelo menos 6 caracteres." };
  }

  if (currentPassword === newPassword) {
    return { success: false, error: "A nova senha deve ser diferente da atual." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  // Verificar senha atual fazendo login
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (signInErr) {
    return { success: false, error: "Senha atual incorreta." };
  }

  // Atualizar senha
  const { error: updateErr } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  revalidatePath("/settings/security");
  return { success: true };
}

/* ─── Update Email ─── */

export async function updateEmail(
  newEmail: string
): Promise<{ success: boolean; error?: string }> {
  if (!newEmail || !newEmail.includes("@")) {
    return { success: false, error: "Email inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  if (user.email === newEmail) {
    return { success: false, error: "O novo email é igual ao atual." };
  }

  const { error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    error: undefined,
  };
}

/* ─── Delete Account ─── */

export async function deleteAccount(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  // Deletar dados do usuário (cascade vai cuidar de profiles, trades, etc)
  // Mas precisamos de admin client para deletar o user do auth
  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const { createClient: createAdmin } = await import("@supabase/supabase-js");
  const admin = createAdmin(adminUrl, adminKey);

  // Deletar trades, import_summaries, trading_accounts primeiro
  await admin.from("trades").delete().eq("user_id", user.id);
  await admin.from("import_summaries").delete().eq("user_id", user.id);
  await admin.from("trading_accounts").delete().eq("user_id", user.id);
  await admin.from("profiles").delete().eq("id", user.id);

  // Deletar o user do auth
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("[deleteAccount]", error.message);
    return { success: false, error: "Erro ao deletar conta. Tente novamente." };
  }

  // Sign out e redirecionar
  await supabase.auth.signOut();
  redirect("/login?message=" + encodeURIComponent("Conta deletada com sucesso."));
}

/* ─── Get Security Info ─── */

export async function getSecurityInfo(): Promise<{
  email: string;
  lastSignIn: string | null;
  provider: string;
  createdAt: string;
  emailConfirmed: boolean;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return {
    email: user.email ?? "",
    lastSignIn: user.last_sign_in_at ?? null,
    provider: user.app_metadata?.provider ?? "email",
    createdAt: user.created_at,
    emailConfirmed: !!user.email_confirmed_at,
  };
}
