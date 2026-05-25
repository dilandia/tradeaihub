"use server"

import { createCompatClient } from "@/lib/supabase/server-compat"
import { getPool } from "@/lib/db"

async function getAuthUser() {
  const supabase = await createCompatClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return user
}

// ─── Application Status ─────────────────────────────────────────────────────

export interface ApplicationStatusInfo {
  status: "pending" | "approved" | "rejected"
  createdAt: string
  reviewedAt: string | null
  reviewNotes: string | null
}

/**
 * Returns the affiliate application status for the current user (by email).
 * Returns null if the user has never applied.
 */
export async function getApplicationStatus(): Promise<ApplicationStatusInfo | null> {
  const supabase = await createCompatClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const email = user.email
  if (!email) return null

  const pool = getPool()
  const result = await pool.query(
    `SELECT status, created_at, reviewed_at, review_notes
     FROM affiliate_applications
     WHERE email = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [email.toLowerCase()]
  )
  const data = result.rows[0]

  if (!data) return null

  return {
    status: data.status as "pending" | "approved" | "rejected",
    createdAt: data.created_at,
    reviewedAt: data.reviewed_at,
    reviewNotes: data.review_notes,
  }
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
  const pool = getPool()

  const result = await pool.query(
    `SELECT id, affiliate_code, commission_rate, is_active, crypto_wallet, crypto_network
     FROM affiliates WHERE user_id = $1 LIMIT 1`,
    [user.id]
  )
  const data = result.rows[0]

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
  const pool = getPool()

  const affResult = await pool.query(
    `SELECT * FROM affiliates WHERE user_id = $1 LIMIT 1`,
    [user.id]
  )
  const affiliate = affResult.rows[0]

  if (!affiliate) return null

  // Pending commissions amount
  const pendingCommsResult = await pool.query(
    `SELECT commission_amount FROM affiliate_commissions WHERE affiliate_id = $1 AND status = 'pending'`,
    [affiliate.id]
  )
  const pendingCommissionsTotal = (pendingCommsResult.rows ?? []).reduce(
    (sum: number, c: { commission_amount: string }) => sum + Number(c.commission_amount),
    0
  )

  // Pending withdrawals amount
  const pendingWithdrawalsResult = await pool.query(
    `SELECT amount FROM affiliate_withdrawals WHERE affiliate_id = $1 AND status IN ('pending', 'processing')`,
    [affiliate.id]
  )
  const pendingWithdrawalsTotal = (pendingWithdrawalsResult.rows ?? []).reduce(
    (sum: number, w: { amount: string }) => sum + Number(w.amount),
    0
  )

  const availableBalance = Math.max(
    0,
    Number(affiliate.total_earned) - Number(affiliate.total_paid) - pendingWithdrawalsTotal
  )

  // Recent referrals (last 20)
  const referralsResult = await pool.query(
    `SELECT id, status, created_at, converted_at
     FROM affiliate_referrals WHERE affiliate_id = $1
     ORDER BY created_at DESC LIMIT 20`,
    [affiliate.id]
  )

  // Recent commissions (last 20)
  const commissionsResult = await pool.query(
    `SELECT id, payment_amount, commission_amount, status, created_at
     FROM affiliate_commissions WHERE affiliate_id = $1
     ORDER BY created_at DESC LIMIT 20`,
    [affiliate.id]
  )

  // Withdrawal history (all)
  const withdrawalsResult = await pool.query(
    `SELECT id, amount, crypto_network, status, tx_hash, created_at
     FROM affiliate_withdrawals WHERE affiliate_id = $1
     ORDER BY created_at DESC`,
    [affiliate.id]
  )

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
    recentReferrals: (referralsResult.rows ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      status: r.status as string,
      createdAt: r.created_at as string,
      convertedAt: r.converted_at as string | null,
    })),
    recentCommissions: (commissionsResult.rows ?? []).map((c: Record<string, unknown>) => ({
      id: c.id as string,
      paymentAmount: Number(c.payment_amount),
      commissionAmount: Number(c.commission_amount),
      status: c.status as string,
      createdAt: c.created_at as string,
    })),
    withdrawals: (withdrawalsResult.rows ?? []).map((w: Record<string, unknown>) => ({
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
  const pool = getPool()

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

  try {
    await pool.query(
      `UPDATE affiliates SET crypto_wallet = $1, crypto_network = $2, updated_at = NOW() WHERE user_id = $3`,
      [trimmedWallet, trimmedNetwork, user.id]
    )
  } catch (err) {
    console.error("[updatePayoutInfo]", err)
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
  const pool = getPool()

  // Get affiliate record
  const affResult = await pool.query(
    `SELECT id, crypto_wallet, crypto_network, is_active FROM affiliates WHERE user_id = $1 LIMIT 1`,
    [user.id]
  )
  const affiliate = affResult.rows[0]

  if (!affiliate || !affiliate.is_active) {
    return { success: false, error: "Affiliate not found or inactive" }
  }

  if (!affiliate.crypto_wallet || !affiliate.crypto_network) {
    return { success: false, error: "Please set your payout wallet before requesting a withdrawal" }
  }

  // Usar RPC via createCompatClient (suporte a rpc no server-compat)
  const supabase = await createCompatClient()
  const result = await supabase.rpc("affiliate_request_withdrawal", {
    p_affiliate_id: affiliate.id,
    p_amount: amount,
    p_wallet: affiliate.crypto_wallet,
    p_network: affiliate.crypto_network,
  })

  if ((result as { error?: Error | null }).error) {
    return { success: false, error: "Failed to process withdrawal request" }
  }

  const data = (result as { data: { success: boolean; error?: string } }).data
  return data
}

/**
 * Returns the full affiliate URL for sharing.
 */
export async function getAffiliateLink(): Promise<string | null> {
  const user = await getAuthUser()
  const pool = getPool()

  const result = await pool.query(
    `SELECT affiliate_code FROM affiliates WHERE user_id = $1 LIMIT 1`,
    [user.id]
  )
  const data = result.rows[0]

  if (!data) return null

  return `https://tradeaihub.com/?aff=${data.affiliate_code}`
}
