/**
 * Processes referral codes stored in user metadata after registration.
 * Runs once on first dashboard load, then clears the metadata field.
 * Fire-and-forget — failures are logged but never block the user.
 */

import { createCompatClient } from "@/lib/supabase/server-compat";
import { getPool, queryOne } from "@/lib/db";

const REFERRED_BONUS_CREDITS = 10;

export async function processReferralOnFirstLogin(): Promise<void> {
  const supabase = await createCompatClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Busca referral_code do metadata do usuário via profiles
  const profile = await queryOne<{ referral_code: string | null }>(
    `SELECT referral_code FROM profiles WHERE id = $1`,
    [user.id]
  );

  const referralCode = profile?.referral_code;
  if (!referralCode) return;

  const pool = getPool();

  // Check if referral already processed
  const existingRef = await queryOne<{ id: string }>(
    `SELECT id FROM referrals WHERE referred_id = $1`,
    [user.id]
  );

  if (existingRef) {
    // Already processed — clear referral_code in profiles
    await pool.query(
      `UPDATE profiles SET referral_code = NULL WHERE id = $1`,
      [user.id]
    );
    return;
  }

  // Validate referral code
  const codeData = await queryOne<{ user_id: string; code: string }>(
    `SELECT user_id, code FROM referral_codes WHERE code = $1 AND is_active = true`,
    [referralCode.toUpperCase().trim()]
  );

  if (!codeData || codeData.user_id === user.id) {
    // Invalid code or self-referral — clear referral_code in profiles
    await pool.query(
      `UPDATE profiles SET referral_code = NULL WHERE id = $1`,
      [user.id]
    );
    return;
  }

  // Create referral record
  try {
    await pool.query(
      `INSERT INTO referrals (referrer_id, referred_id, referral_code, status) VALUES ($1, $2, $3, 'pending')`,
      [codeData.user_id, user.id, codeData.code]
    );
  } catch (error) {
    console.error("[referral-processor] Failed to create referral:", error);
    return;
  }

  // Grant bonus credits to the referred user
  if (REFERRED_BONUS_CREDITS > 0) {
    try {
      await pool.query(
        `SELECT * FROM add_referral_credits(p_user_id => $1, p_amount => $2)`,
        [user.id, REFERRED_BONUS_CREDITS]
      );
    } catch (error) {
      console.error("[referral-processor] Failed to add referral credits:", error);
    }
  }

  // Clear the referral code from profiles (processed)
  await pool.query(
    `UPDATE profiles SET referral_code = NULL WHERE id = $1`,
    [user.id]
  );
}
