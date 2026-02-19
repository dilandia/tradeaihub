/**
 * Funções para persistir e carregar conversas do AI Copilot.
 */
import { createClient } from "@/lib/supabase/server";

export type CopilotMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type CopilotConversation = {
  id: string;
  user_id: string;
  import_id: string | null;
  account_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages?: CopilotMessage[];
};

/** Lista conversas do usuário (mais recentes primeiro) */
export async function listConversations(userId: string, limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_copilot_conversations")
    .select("id, import_id, account_id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as Omit<CopilotConversation, "messages">[];
}

/** Busca mensagens de uma conversa */
export async function getConversationMessages(
  conversationId: string,
  userId: string
): Promise<CopilotMessage[]> {
  const supabase = await createClient();
  const { data: conv } = await supabase
    .from("ai_copilot_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();

  if (!conv) return [];

  const { data, error } = await supabase
    .from("ai_copilot_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data ?? []) as CopilotMessage[];
}

/** Cria nova conversa e retorna o id */
export async function createConversation(
  userId: string,
  importId?: string | null,
  accountId?: string | null
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_copilot_conversations")
    .insert({
      user_id: userId,
      import_id: importId ?? null,
      account_id: accountId ?? null,
    })
    .select("id")
    .single();

  if (error) return null;
  return data?.id ?? null;
}

/** Adiciona mensagem à conversa */
export async function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data: conv } = await supabase
    .from("ai_copilot_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();

  if (!conv) return false;

  const { count: existingCount } = await supabase
    .from("ai_copilot_messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId);

  const { error } = await supabase.from("ai_copilot_messages").insert({
    conversation_id: conversationId,
    role,
    content,
  });

  if (error) return false;

  const updates: { updated_at: string; title?: string | null } = { updated_at: new Date().toISOString() };
  if (role === "user" && existingCount === 0) {
    const t = content.slice(0, 80).trim();
    updates.title = t || null;
  }

  await supabase
    .from("ai_copilot_conversations")
    .update(updates)
    .eq("id", conversationId);

  return true;
}

/** Atualiza o título de uma conversa */
export async function updateConversationTitle(
  conversationId: string,
  title: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ai_copilot_conversations")
    .update({
      title: title.trim().slice(0, 100) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .eq("user_id", userId);

  return !error;
}
