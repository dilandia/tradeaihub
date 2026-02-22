"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Constants ───────────────────────────────────────────────────────────────

const REFERRER_REWARD_CREDITS = 50;
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
  const supabase = await createClient();
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
  const supabase = await createClient();

  // Check for existing code
  const { data: existing } = await supabase
    .from("referral_codes")
    .select("code")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (existing?.code) return existing.code;

  // Get user name for code generation
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const name = (user?.user_metadata?.full_name as string) || "USER";
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
  const admin = createAdminClient();

  const { data: referrals } = await admin
    .from("referrals")
    .select("status, reward_amount")
    .eq("referrer_id", userId);

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
    .reduce((sum, r) => sum + (r.reward_amount ?? 0), 0);

  return { totalReferrals: total, converted, pending, creditsEarned };
}

/**
 * Returns referral history for the authenticated user.
 */
export async function getReferralHistory(): Promise<ReferralHistoryItem[]> {
  const userId = await getAuthUserId();
  const admin = createAdminClient();

  const { data: referrals } = await admin
    .from("referrals")
    .select("id, referred_id, status, created_at, converted_at, rewarded_at, reward_amount")
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false });

  if (!referrals || referrals.length === 0) return [];

  // Get referred user info
  const referredIds = referrals.map((r) => r.referred_id as string);
  const userNames: Record<string, { name: string; email: string }> = {};

  for (const refId of referredIds) {
    const { data } = await admin.auth.admin.getUserById(refId);
    if (data?.user) {
      userNames[refId] = {
        name: (data.user.user_metadata?.full_name as string) || "User",
        email: data.user.email || "",
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
  const admin = createAdminClient();

  // Validate referral code exists and is active
  const { data: codeData } = await admin
    .from("referral_codes")
    .select("user_id, code")
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .single();

  if (!codeData) return false;

  const referrerId = codeData.user_id as string;

  // Cannot refer yourself
  if (referrerId === userId) return false;

  // Check if already referred
  const { data: existingRef } = await admin
    .from("referrals")
    .select("id")
    .eq("referred_id", userId)
    .single();

  if (existingRef) return false;

  // Create referral record
  const { error } = await admin.from("referrals").insert({
    referrer_id: referrerId,
    referred_id: userId,
    referral_code: codeData.code,
    status: "pending",
  });

  if (error) {
    console.error("[referrals] Failed to create referral:", error);
    return false;
  }

  // Grant bonus credits to the referred user
  if (REFERRED_BONUS_CREDITS > 0) {
    await admin.rpc("add_referral_credits", {
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
  const admin = createAdminClient();

  // Find pending referral for this user
  const { data: referral } = await admin
    .from("referrals")
    .select("id, referrer_id, status")
    .eq("referred_id", referredUserId)
    .single();

  if (!referral || referral.status !== "pending") return false;

  const now = new Date().toISOString();

  // Mark as converted + rewarded and record reward
  const { error } = await admin
    .from("referrals")
    .update({
      status: "rewarded",
      reward_type: "credits",
      reward_amount: REFERRER_REWARD_CREDITS,
      converted_at: now,
      rewarded_at: now,
    })
    .eq("id", referral.id);

  if (error) {
    console.error("[referrals] Failed to convert referral:", error);
    return false;
  }

  // Grant credits to the referrer
  await admin.rpc("add_referral_credits", {
    p_user_id: referral.referrer_id,
    p_amount: REFERRER_REWARD_CREDITS,
  });

  return true;
}
