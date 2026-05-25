"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCompatClient } from "@/lib/supabase/server-compat";
import { getPool } from "@/lib/db";

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

  const supabase = await createCompatClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  // Verificar senha atual — Better Auth via API route
  try {
    const { auth: betterAuth } = await import("@/lib/auth");
    const verified = await betterAuth.api.signInWithPassword({
      body: { email: user.email, password: currentPassword },
    });
    if (!verified) {
      return { success: false, error: "Senha atual incorreta." };
    }
  } catch {
    return { success: false, error: "Senha atual incorreta." };
  }

  // Atualizar senha via pg direto (Better Auth armazena hash em better_auth_account.password)
  try {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash(newPassword, 10);
    const pool = getPool();
    await pool.query(
      `UPDATE better_auth_account SET password = $1 WHERE user_id = $2 AND provider_id = 'credential'`,
      [hash, user.id]
    );
  } catch (err) {
    console.error("[updatePassword]", err);
    return { success: false, error: "Erro ao atualizar senha. Verifique os requisitos e tente novamente." };
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

  const supabase = await createCompatClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  if (user.email === newEmail) {
    return { success: false, error: "O novo email é igual ao atual." };
  }

  // Atualizar email via query pg direta (Better Auth)
  try {
    const pool = getPool();
    await pool.query(
      `UPDATE better_auth_user SET email = $1, email_verified = false, updated_at = NOW() WHERE id = $2`,
      [newEmail, user.id]
    );
  } catch (err) {
    console.error("[updateEmail]", err);
    return { success: false, error: "Erro ao atualizar email. Tente novamente." };
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
  const supabase = await createCompatClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  // Deletar dados do usuário via pg direto
  // CASCADE FKs cuidam de: trades, import_summaries, trading_accounts, profiles,
  // ai_credits, credit_purchases, subscriptions, strategies, feedback,
  // email_preferences, support_tickets, support_conversations, user_tags,
  // user_preferences, etc.
  // affiliates.user_id será SET NULL (preserva histórico de referrals)
  try {
    const pool = getPool();

    // Delete rows from tables with NO ACTION FK constraint on user_id
    // These would block auth.users deletion if not removed first
    await pool.query(`DELETE FROM support_ticket_replies WHERE user_id = $1`, [user.id]);
    await pool.query(`DELETE FROM admin_credit_adjustments WHERE user_id = $1`, [user.id]);

    // Delete the auth user — CASCADE FKs auto-clean dependentes
    await pool.query(`DELETE FROM better_auth_user WHERE id = $1`, [user.id]);
  } catch (err) {
    console.error("[deleteAccount]", err);
    return { success: false, error: "Erro ao deletar conta. Tente novamente." };
  }

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
  const supabase = await createCompatClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Buscar dados complementares via pg
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT email, created_at, email_verified FROM better_auth_user WHERE id = $1`,
      [user.id]
    );
    const row = result.rows[0];
    if (!row) return null;

    // Verificar provider (credential ou social)
    const accResult = await pool.query(
      `SELECT provider_id FROM better_auth_account WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );
    const provider = accResult.rows[0]?.provider_id ?? "email";

    return {
      email: row.email ?? "",
      lastSignIn: null, // Better Auth não expõe last_sign_in via session
      provider,
      createdAt: row.created_at,
      emailConfirmed: !!row.email_verified,
    };
  } catch (err) {
    console.error("[getSecurityInfo]", err);
    return null;
  }
}
