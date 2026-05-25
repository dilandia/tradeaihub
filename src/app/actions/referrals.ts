"use server";

import { createCompatClient } from "@/lib/supabase/server-compat";
import { getPool } from "@/lib/db";

// ─── Constants ───────────────────────────────────────────────────────────────

const REFERRER_REWARD_CREDITS = 20;
const REFERRED_BONUS_CREDITS = 10;

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReferralStats = {
  totalReferrals: number;
  converted: number;
  pending: number;
  creditsEarned: number;
};

export type ReferralHistoryItem = {
  id: string;
  referredName: string;
  referredEmail: string;
  status: "pending" | "converted" | "rewarded";
  createdAt: string;
  convertedAt: string | null;
  rewardedAt: string | null;
  rewardAmount: number | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getAuthUserId(): Promise<string> {
  const supabase = await createCompatClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

function generateCode(name: string): string {
  const prefix = name
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 4)
    .toUpperCase()
    .padEnd(4, "X");
  const hex = Math.random().toString(16).substring(2, 6).toUpperCase();
  return `TAKEZ-${prefix}-${hex}`;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  const visible = local.substring(0, 2);
  return `${visible}***@${domain}`;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Gets or creates the user's referral code.
 */
export async function getOrCreateReferralCode(): Promise<string> {
  const userId = await getAuthUserId();
  const supabase = await createCompatClient();

  // Check for existing code
  const { data: existing } = await supabase
    .from("referral_codes")
    .select("code")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (existing?.code) return existing.code as string;

  // Get user name for code generation via pg
  const pool = getPool();
  const userRow = await pool.query(
    `SELECT name FROM better_auth_user WHERE id = $1`,
    [userId]
  );
  const name = (userRow.rows[0]?.name as string) || "USER";
  const code = generateCode(name);

  const { error } = await supabase.from("referral_codes").insert({
    user_id: userId,
    code,
    is_active: true,
  });

  if (error) {
    // Collision — retry once with new random
    const retryCode = generateCode(name);
    await supabase.from("referral_codes").insert({
      user_id: userId,
      code: retryCode,
      is_active: true,
    });
    return retryCode;
  }

  return code;
}

/**
 * Returns referral statistics for the authenticated user.
 */
export async function getReferralStats(): Promise<ReferralStats> {
  const userId = await getAuthUserId();
  const pool = getPool();

  const result = await pool.query(
    `SELECT status, reward_amount FROM referrals WHERE referrer_id = $1`,
    [userId]
  );
  const referrals = result.rows;

  if (!referrals || referrals.length === 0) {
    return { totalReferrals: 0, converted: 0, pending: 0, creditsEarned: 0 };
  }

  const total = referrals.length;
  const converted = referrals.filter(
    (r) => r.status === "converted" || r.status === "rewarded"
  ).length;
  const pending = referrals.filter((r) => r.status === "pending").length;
  const creditsEarned = referrals
    .filter((r) => r.status === "rewarded")
    .reduce((sum: number, r) => sum + (Number(r.reward_amount) ?? 0), 0);

  return { totalReferrals: total, converted, pending, creditsEarned };
}

/**
 * Returns referral history for the authenticated user.
 */
export async function getReferralHistory(): Promise<ReferralHistoryItem[]> {
  const userId = await getAuthUserId();
  const pool = getPool();

  const result = await pool.query(
    `SELECT id, referred_id, status, created_at, converted_at, rewarded_at, reward_amount
     FROM referrals WHERE referrer_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  const referrals = result.rows;

  if (!referrals || referrals.length === 0) return [];

  // Get referred user info from better_auth_user
  const referredIds = referrals.map((r) => r.referred_id as string);
  const userNames: Record<string, { name: string; email: string }> = {};

  for (const refId of referredIds) {
    const userRes = await pool.query(
      `SELECT name, email FROM better_auth_user WHERE id = $1`,
      [refId]
    );
    const row = userRes.rows[0];
    if (row) {
      userNames[refId] = {
        name: (row.name as string) || "User",
        email: (row.email as string) || "",
      };
    }
  }

  return referrals.map((r) => {
    const info = userNames[r.referred_id as string];
    return {
      id: r.id as string,
      referredName: info?.name || "User",
      referredEmail: info?.email ? maskEmail(info.email) : "***@***",
      status: r.status as "pending" | "converted" | "rewarded",
      createdAt: r.created_at as string,
      convertedAt: r.converted_at as string | null,
      rewardedAt: r.rewarded_at as string | null,
      rewardAmount: r.reward_amount as number | null,
    };
  });
}

/**
 * Called during registration — links new user to referrer.
 * Grants bonus credits to the referred user.
 */
export async function applyReferralCode(code: string): Promise<boolean> {
  const userId = await getAuthUserId();
  const pool = getPool();

  // Validate referral code exists and is active
  const codeRes = await pool.query(
    `SELECT user_id, code FROM referral_codes WHERE code = $1 AND is_active = true LIMIT 1`,
    [code.toUpperCase().trim()]
  );
  const codeData = codeRes.rows[0];

  if (!codeData) return false;

  const referrerId = codeData.user_id as string;

  // Cannot refer yourself
  if (referrerId === userId) return false;

  // Check if already referred
  const existingRes = await pool.query(
    `SELECT id FROM referrals WHERE referred_id = $1 LIMIT 1`,
    [userId]
  );
  if (existingRes.rows.length > 0) return false;

  // Create referral record
  try {
    await pool.query(
      `INSERT INTO referrals (referrer_id, referred_id, referral_code, status)
       VALUES ($1, $2, $3, 'pending')`,
      [referrerId, userId, codeData.code]
    );
  } catch (err) {
    console.error("[referrals] Failed to create referral:", err);
    return false;
  }

  // Grant bonus credits to the referred user via RPC
  if (REFERRED_BONUS_CREDITS > 0) {
    const supabase = await createCompatClient();
    await supabase.rpc("add_referral_credits", {
      p_user_id: userId,
      p_amount: REFERRED_BONUS_CREDITS,
    });
  }

  return true;
}

/**
 * Called when a referred user subscribes to a paid plan.
 * Marks referral as converted and grants reward to the referrer.
 */
export async function convertReferral(referredUserId: string): Promise<boolean> {
  const pool = getPool();

  // Find pending referral for this user
  const refRes = await pool.query(
    `SELECT id, referrer_id, status FROM referrals WHERE referred_id = $1 LIMIT 1`,
    [referredUserId]
  );
  const referral = refRes.rows[0];

  if (!referral || referral.status !== "pending") return false;

  const now = new Date().toISOString();

  // Mark as converted + rewarded and record reward
  try {
    await pool.query(
      `UPDATE referrals SET status = 'rewarded', reward_type = 'credits',
       reward_amount = $1, converted_at = $2, rewarded_at = $2
       WHERE id = $3`,
      [REFERRER_REWARD_CREDITS, now, referral.id]
    );
  } catch (err) {
    console.error("[referrals] Failed to convert referral:", err);
    return false;
  }

  // Grant credits to the referrer via RPC
  const supabase = await createCompatClient();
  await supabase.rpc("add_referral_credits", {
    p_user_id: referral.referrer_id,
    p_amount: REFERRER_REWARD_CREDITS,
  });

  return true;
}
