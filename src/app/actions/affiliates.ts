"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return user
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AffiliateInfo {
  id: string
  affiliateCode: string
  commissionRate: number
  isActive: boolean
  cryptoWallet: string | null
  cryptoNetwork: string | null
}

export interface AffiliateDashboardData {
  affiliate: AffiliateInfo
  stats: {
    totalReferrals: number
    totalConversions: number
    totalEarned: number
    totalPaid: number
    availableBalance: number
    pendingCommissions: number
  }
  recentReferrals: Array<{
    id: string
    status: string
    createdAt: string
    convertedAt: string | null
  }>
  recentCommissions: Array<{
    id: string
    paymentAmount: number
    commissionAmount: number
    status: string
    createdAt: string
  }>
  withdrawals: Array<{
    id: string
    amount: number
    cryptoNetwork: string
    status: string
    txHash: string | null
    createdAt: string
  }>
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Returns the affiliate record for the current user, or null if not an affiliate.
 */
export async function getAffiliateStatus(): Promise<AffiliateInfo | null> {
  const user = await getAuthUser()
  const admin = getAdmin()

  const { data } = await admin
    .from("affiliates")
    .select("id, affiliate_code, commission_rate, is_active, crypto_wallet, crypto_network")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!data) return null

  return {
    id: data.id,
    affiliateCode: data.affiliate_code,
    commissionRate: Number(data.commission_rate),
    isActive: data.is_active,
    cryptoWallet: data.crypto_wallet,
    cryptoNetwork: data.crypto_network,
  }
}

/**
 * Returns full dashboard data for the current affiliate.
 */
export async function getAffiliateDashboard(): Promise<AffiliateDashboardData | null> {
  const user = await getAuthUser()
  const admin = getAdmin()

  const { data: affiliate } = await admin
    .from("affiliates")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!affiliate) return null

  // Pending commissions amount
  const { data: pendingComms } = await admin
    .from("affiliate_commissions")
    .select("commission_amount")
    .eq("affiliate_id", affiliate.id)
    .eq("status", "pending")

  const pendingCommissionsTotal = (pendingComms ?? []).reduce(
    (sum: number, c: { commission_amount: number }) => sum + Number(c.commission_amount),
    0
  )

  // Pending withdrawals amount
  const { data: pendingWithdrawals } = await admin
    .from("affiliate_withdrawals")
    .select("amount")
    .eq("affiliate_id", affiliate.id)
    .in("status", ["pending", "processing"])

  const pendingWithdrawalsTotal = (pendingWithdrawals ?? []).reduce(
    (sum: number, w: { amount: number }) => sum + Number(w.amount),
    0
  )

  const availableBalance = Math.max(
    0,
    Number(affiliate.total_earned) - Number(affiliate.total_paid) - pendingWithdrawalsTotal
  )

  // Recent referrals (last 20)
  const { data: referrals } = await admin
    .from("affiliate_referrals")
    .select("id, status, created_at, converted_at")
    .eq("affiliate_id", affiliate.id)
    .order("created_at", { ascending: false })
    .limit(20)

  // Recent commissions (last 20)
  const { data: commissions } = await admin
    .from("affiliate_commissions")
    .select("id, payment_amount, commission_amount, status, created_at")
    .eq("affiliate_id", affiliate.id)
    .order("created_at", { ascending: false })
    .limit(20)

  // Withdrawal history (all)
  const { data: withdrawals } = await admin
    .from("affiliate_withdrawals")
    .select("id, amount, crypto_network, status, tx_hash, created_at")
    .eq("affiliate_id", affiliate.id)
    .order("created_at", { ascending: false })

  return {
    affiliate: {
      id: affiliate.id,
      affiliateCode: affiliate.affiliate_code,
      commissionRate: Number(affiliate.commission_rate),
      isActive: affiliate.is_active,
      cryptoWallet: affiliate.crypto_wallet,
      cryptoNetwork: affiliate.crypto_network,
    },
    stats: {
      totalReferrals: affiliate.total_referrals ?? 0,
      totalConversions: affiliate.total_conversions ?? 0,
      totalEarned: Number(affiliate.total_earned ?? 0),
      totalPaid: Number(affiliate.total_paid ?? 0),
      availableBalance,
      pendingCommissions: pendingCommissionsTotal,
    },
    recentReferrals: (referrals ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      status: r.status as string,
      createdAt: r.created_at as string,
      convertedAt: r.converted_at as string | null,
    })),
    recentCommissions: (commissions ?? []).map((c: Record<string, unknown>) => ({
      id: c.id as string,
      paymentAmount: Number(c.payment_amount),
      commissionAmount: Number(c.commission_amount),
      status: c.status as string,
      createdAt: c.created_at as string,
    })),
    withdrawals: (withdrawals ?? []).map((w: Record<string, unknown>) => ({
      id: w.id as string,
      amount: Number(w.amount),
      cryptoNetwork: w.crypto_network as string,
      status: w.status as string,
      txHash: w.tx_hash as string | null,
      createdAt: w.created_at as string,
    })),
  }
}

/**
 * Updates the affiliate's crypto payout info.
 */
const ALLOWED_NETWORKS = ["USDT-TRC20", "USDC-ERC20", "BTC", "ETH"] as const

export async function updatePayoutInfo(
  wallet: string,
  network: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthUser()
  const admin = getAdmin()

  const trimmedWallet = wallet.trim()
  const trimmedNetwork = network.trim()

  if (!trimmedWallet || !trimmedNetwork) {
    return { success: false, error: "Wallet and network are required" }
  }

  if (!ALLOWED_NETWORKS.includes(trimmedNetwork as typeof ALLOWED_NETWORKS[number])) {
    return { success: false, error: `Invalid network. Allowed: ${ALLOWED_NETWORKS.join(", ")}` }
  }

  if (trimmedWallet.length > 200) {
    return { success: false, error: "Wallet address is too long (max 200 characters)" }
  }

  if (trimmedWallet.length < 10) {
    return { success: false, error: "Wallet address is too short" }
  }

  const { error } = await admin
    .from("affiliates")
    .update({ crypto_wallet: trimmedWallet, crypto_network: trimmedNetwork, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)

  if (error) {
    return { success: false, error: "Failed to update payout info" }
  }

  return { success: true }
}

/**
 * Requests a withdrawal for the current affiliate.
 */
export async function requestWithdrawal(
  amount: number
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthUser()
  const admin = getAdmin()

  // Get affiliate record
  const { data: affiliate } = await admin
    .from("affiliates")
    .select("id, crypto_wallet, crypto_network, is_active")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!affiliate || !affiliate.is_active) {
    return { success: false, error: "Affiliate not found or inactive" }
  }

  if (!affiliate.crypto_wallet || !affiliate.crypto_network) {
    return { success: false, error: "Please set your payout wallet before requesting a withdrawal" }
  }

  const result = await admin.rpc("affiliate_request_withdrawal", {
    p_affiliate_id: affiliate.id,
    p_amount: amount,
    p_wallet: affiliate.crypto_wallet,
    p_network: affiliate.crypto_network,
  })

  if (result.error) {
    return { success: false, error: "Failed to process withdrawal request" }
  }

  const data = result.data as { success: boolean; error?: string }
  return data
}

/**
 * Returns the full affiliate URL for sharing.
 */
export async function getAffiliateLink(): Promise<string | null> {
  const user = await getAuthUser()
  const admin = getAdmin()

  const { data } = await admin
    .from("affiliates")
    .select("affiliate_code")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!data) return null

  return `https://tradeaihub.com/?aff=${data.affiliate_code}`
}
