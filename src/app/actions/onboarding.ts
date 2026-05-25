"use server";

import { createCompatClient } from "@/lib/supabase/server-compat";

export type OnboardingPayload = {
  experienceLevel?: string;
  instruments?: string[];
  platform?: string;
};

export async function saveOnboardingResponse(
  payload: OnboardingPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createCompatClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  const { error } = await supabase
    .from("onboarding_responses")
    .upsert(
      {
        user_id: user.id,
        experience_level: payload.experienceLevel ?? null,
        instruments: payload.instruments ?? [],
        platform: payload.platform ?? null,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[saveOnboardingResponse]", error.message);
    return { success: false, error: "Erro ao salvar respostas. Tente novamente." };
  }

  return { success: true };
}

export async function checkOnboardingCompleted(): Promise<boolean> {
  const supabase = await createCompatClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return true; // No user = skip onboarding

  const { data } = await supabase
    .from("onboarding_responses")
    .select("completed_at")
    .eq("user_id", user.id)
    .single();

  return !!data?.completed_at;
}
