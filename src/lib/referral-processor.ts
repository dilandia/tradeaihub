/**
 * Processes referral codes stored in user metadata after registration.
 * Runs once on first dashboard load, then clears the metadata field.
 * Fire-and-forget — failures are logged but never block the user.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const REFERRED_BONUS_CREDITS = 10;

export async function processReferralOnFirstLogin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const referralCode = user.user_metadata?.referral_code as string | undefined;
  if (!referralCode) return;

  const admin = createAdminClient();

  // Check if referral already processed
  const { data: existingRef } = await admin
    .from("referrals")
    .select("id")
    .eq("referred_id", user.id)
    .single();

  if (existingRef) {
    // Already processed — clear metadata
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { referral_code: null },
    });
    return;
  }

  // Validate referral code
  const { data: codeData } = await admin
    .from("referral_codes")
    .select("user_id, code")
    .eq("code", referralCode.toUpperCase().trim())
    .eq("is_active", true)
    .single();

  if (!codeData || (codeData.user_id as string) === user.id) {
    // Invalid code or self-referral — clear metadata
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { referral_code: null },
    });
    return;
  }

  // Create referral record
  const { error } = await admin.from("referrals").insert({
    referrer_id: codeData.user_id,
    referred_id: user.id,
    referral_code: codeData.code,
    status: "pending",
  });

  if (error) {
    console.error("[referral-processor] Failed to create referral:", error);
    return;
  }

  // Grant bonus credits to the referred user
  if (REFERRED_BONUS_CREDITS > 0) {
    await admin.rpc("add_referral_credits", {
      p_user_id: user.id,
      p_amount: REFERRED_BONUS_CREDITS,
    });
  }

  // Clear the referral code from metadata (processed)
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { referral_code: null },
  });
}
