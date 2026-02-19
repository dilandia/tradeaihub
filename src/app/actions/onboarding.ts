"use server";

import { createClient } from "@/lib/supabase/server";

export type OnboardingPayload = {
  experienceLevel?: string;
  instruments?: string[];
  platform?: string;
};

export async function saveOnboardingResponse(
  payload: OnboardingPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
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
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[saveOnboardingResponse]", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}
