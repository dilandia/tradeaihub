/**
 * Cache de insights de IA no Supabase.
 * TTL: 1 hora. Reduz custos de chamadas repetidas à OpenAI.
 */
import { createClient } from "@/lib/supabase/server";

const TTL_HOURS = 1;

function buildCacheKey(
  agentType: string,
  params: { importId?: string | null; accountId?: string | null; period?: string; reportType?: string; locale?: string }
): string {
  const parts = [
    agentType,
    ...(agentType === "risk" ? ["v3"] : agentType === "takerz-score" ? ["v2"] : []),
    params.importId ?? "all",
    params.accountId ?? "all",
    params.period ?? "all",
    params.locale ?? "en",
  ];
  if (params.reportType) parts.push(params.reportType);
  return parts.join(":");
}

export async function getCachedInsight(
  agentType: string,
  params: { importId?: string | null; accountId?: string | null; period?: string; reportType?: string; locale?: string }
): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const cacheKey = buildCacheKey(agentType, params);
  const { data, error } = await supabase
    .from("ai_insights_cache")
    .select("response")
    .eq("user_id", user.id)
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;
  return data.response;
}

export async function setCachedInsight(
  agentType: string,
  params: { importId?: string | null; accountId?: string | null; period?: string; reportType?: string; locale?: string },
  response: string
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const cacheKey = buildCacheKey(agentType, params);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TTL_HOURS);

  await supabase
    .from("ai_insights_cache")
    .upsert(
      { user_id: user.id, cache_key: cacheKey, response, expires_at: expiresAt.toISOString() },
      { onConflict: "user_id,cache_key" }
    );
}
