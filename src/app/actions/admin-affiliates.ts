"use server"

import { getPool } from "@/lib/db"
import { verifyAdmin } from "@/lib/admin-auth"
import { sendAffiliateApprovedEmail, sendAffiliateRejectedEmail } from "@/lib/email/send"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AffiliateApplication {
  id: string
  full_name: string
  email: string
  whatsapp: string | null
  primary_social: string
  social_url: string | null
  audience_size: string | null
  trading_experience: string | null
  pitch: string
  status: "pending" | "approved" | "rejected"
  reviewed_at: string | null
  review_notes: string | null
  affiliate_id: string | null
  preferred_locale: string | null
  created_at: string
}

export interface AffiliateRecord {
  id: string
  user_id: string | null
  full_name: string
  email: string
  whatsapp: string | null
  affiliate_code: string
  commission_rate: number
  is_active: boolean
  crypto_wallet: string | null
  crypto_network: string | null
  total_referrals: number
  total_conversions: number
  total_earned: number
  total_paid: number
  created_at: string
}

export interface AffiliateWithdrawal {
  id: string
  affiliate_id: string
  amount: number
  currency: string
  crypto_wallet: string
  crypto_network: string
  status: string
  tx_hash: string | null
  admin_notes: string | null
  created_at: string
  affiliate_name?: string
  affiliate_email?: string
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function getAffiliateApplications(
  status?: "pending" | "approved" | "rejected"
): Promise<AffiliateApplication[]> {
  await verifyAdmin()
  const pool = getPool()

  const params: unknown[] = []
  let whereClause = ""
  if (status) {
    params.push(status)
    whereClause = `WHERE status = $1`
  }

  const res = await pool.query(
    `SELECT * FROM affiliate_applications ${whereClause} ORDER BY created_at DESC`,
    params
  )
  return (res.rows ?? []) as AffiliateApplication[]
}

function generateAffiliateCode(name: string): string {
  const prefix = name
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 6)
    .toUpperCase()
    .padEnd(4, "X")
  const hex = Math.random().toString(16).substring(2, 6).toUpperCase()
  return `AFF-${prefix}-${hex}`
}

export async function approveApplication(
  applicationId: string,
  commissionRate: number = 0.15
): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin()
  const pool = getPool()

  // Get application
  const appRes = await pool.query(
    `SELECT * FROM affiliate_applications WHERE id = $1 LIMIT 1`,
    [applicationId]
  )
  const app = appRes.rows[0] as AffiliateApplication | undefined
  if (!app) return { success: false, error: "Application not found" }
  if (app.status !== "pending") return { success: false, error: "Application is not pending" }

  // Check if affiliate already exists for this email
  const existingRes = await pool.query(
    `SELECT id FROM affiliates WHERE email = $1 LIMIT 1`,
    [app.email]
  )
  if (existingRes.rows[0]) {
    return { success: false, error: "An affiliate with this email already exists" }
  }

  // Lookup user_id by email via profiles table
  let userId: string | null = null
  const profileRes = await pool.query(
    `SELECT id FROM profiles WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [app.email.trim()]
  )
  if (profileRes.rows[0]) {
    userId = profileRes.rows[0].id
  }

  // Generate unique affiliate code
  let code = generateAffiliateCode(app.full_name)
  let attempts = 0
  while (attempts < 5) {
    const codeRes = await pool.query(
      `SELECT id FROM affiliates WHERE affiliate_code = $1 LIMIT 1`,
      [code]
    )
    if (!codeRes.rows[0]) break
    code = generateAffiliateCode(app.full_name)
    attempts++
  }

  // Create affiliate record
  let newAffiliateId: string | null = null
  try {
    const createRes = await pool.query(
      `INSERT INTO affiliates (user_id, full_name, email, whatsapp, affiliate_code, commission_rate)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [userId, app.full_name, app.email, app.whatsapp, code, commissionRate]
    )
    newAffiliateId = createRes.rows[0]?.id ?? null
  } catch (e) {
    console.error("[admin-affiliates] create affiliate:", e)
    return { success: false, error: "Failed to create affiliate record" }
  }

  if (!newAffiliateId) return { success: false, error: "Failed to create affiliate record" }

  // Update application status
  try {
    await pool.query(
      `UPDATE affiliate_applications SET status = 'approved', reviewed_at = NOW(), affiliate_id = $1 WHERE id = $2`,
      [newAffiliateId, applicationId]
    )
  } catch (e) {
    console.error("[admin-affiliates] update application:", e)
    return { success: false, error: "Failed to update application status" }
  }

  // Send approval email (non-blocking)
  sendAffiliateApprovedEmail({
    to: app.email,
    affiliateName: app.full_name,
    affiliateCode: code,
    commissionRate,
    locale: app.preferred_locale || undefined,
  }).catch((e) => console.error("[admin-affiliates] approval email error:", e))

  return { success: true }
}

export async function rejectApplication(
  applicationId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin()
  const pool = getPool()

  // Get application info for email and status check
  const appRes = await pool.query(
    `SELECT full_name, email, status, preferred_locale FROM affiliate_applications WHERE id = $1 LIMIT 1`,
    [applicationId]
  )
  const app = appRes.rows[0] as Pick<AffiliateApplication, "full_name" | "email" | "status" | "preferred_locale"> | undefined

  if (!app) return { success: false, error: "Application not found" }
  if (app.status !== "pending") {
    return { success: false, error: `Cannot reject: application is already ${app.status}` }
  }

  try {
    await pool.query(
      `UPDATE affiliate_applications SET status = 'rejected', reviewed_at = NOW(), review_notes = $1 WHERE id = $2`,
      [reason || null, applicationId]
    )
  } catch {
    return { success: false, error: "Failed to reject application" }
  }

  // Send rejection email (non-blocking)
  if (app?.email) {
    sendAffiliateRejectedEmail({
      to: app.email,
      applicantName: app.full_name,
      reason: reason || undefined,
      locale: app.preferred_locale || undefined,
    }).catch((e) => console.error("[admin-affiliates] rejection email error:", e))
  }

  return { success: true }
}

export async function getAffiliatesList(): Promise<AffiliateRecord[]> {
  await verifyAdmin()
  const pool = getPool()

  const res = await pool.query(
    `SELECT * FROM affiliates ORDER BY total_earned DESC`
  )
  return (res.rows ?? []) as AffiliateRecord[]
}

export async function toggleAffiliateStatus(
  affiliateId: string
): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin()
  const pool = getPool()

  const currentRes = await pool.query(
    `SELECT is_active FROM affiliates WHERE id = $1 LIMIT 1`,
    [affiliateId]
  )
  const current = currentRes.rows[0] as { is_active: boolean } | undefined
  if (!current) return { success: false, error: "Affiliate not found" }

  try {
    await pool.query(
      `UPDATE affiliates SET is_active = $1, updated_at = NOW() WHERE id = $2`,
      [!current.is_active, affiliateId]
    )
  } catch {
    return { success: false, error: "Failed to update status" }
  }

  return { success: true }
}

export async function updateCommissionRate(
  affiliateId: string,
  rate: number
): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin()
  const pool = getPool()

  if (rate < 0 || rate > 1) {
    return { success: false, error: "Rate must be between 0 and 1" }
  }

  try {
    await pool.query(
      `UPDATE affiliates SET commission_rate = $1, updated_at = NOW() WHERE id = $2`,
      [rate, affiliateId]
    )
  } catch {
    return { success: false, error: "Failed to update commission rate" }
  }

  return { success: true }
}

export async function getPendingWithdrawals(): Promise<AffiliateWithdrawal[]> {
  await verifyAdmin()
  const pool = getPool()

  const res = await pool.query(
    `SELECT w.*, a.full_name AS affiliate_name, a.email AS affiliate_email
     FROM affiliate_withdrawals w
     LEFT JOIN affiliates a ON a.id = w.affiliate_id
     WHERE w.status = 'pending'
     ORDER BY w.created_at ASC`
  )

  return (res.rows ?? []) as AffiliateWithdrawal[]
}

export async function processWithdrawal(
  withdrawalId: string,
  txHash: string
): Promise<{ success: boolean; error?: string }> {
  const user = await verifyAdmin()
  const pool = getPool()

  if (!txHash.trim()) {
    return { success: false, error: "Transaction hash is required" }
  }

  // Get withdrawal to know the amount and affiliate
  const wdRes = await pool.query(
    `SELECT affiliate_id, amount, status FROM affiliate_withdrawals WHERE id = $1 LIMIT 1`,
    [withdrawalId]
  )
  const withdrawal = wdRes.rows[0] as { affiliate_id: string; amount: number; status: string } | undefined

  if (!withdrawal) return { success: false, error: "Withdrawal not found" }
  if (withdrawal.status !== "pending") {
    return { success: false, error: "Withdrawal is not in pending status" }
  }

  // Mark withdrawal as completed
  try {
    await pool.query(
      `UPDATE affiliate_withdrawals SET status = 'completed', tx_hash = $1, processed_by = $2, processed_at = NOW() WHERE id = $3`,
      [txHash.trim(), user.id, withdrawalId]
    )
  } catch {
    return { success: false, error: "Failed to process withdrawal" }
  }

  // Atomically increment total_paid using optimistic locking to prevent race conditions
  for (let retry = 0; retry < 3; retry++) {
    const affRes = await pool.query(
      `SELECT total_paid FROM affiliates WHERE id = $1 LIMIT 1`,
      [withdrawal.affiliate_id]
    )
    const aff = affRes.rows[0] as { total_paid: number } | undefined
    if (!aff) break

    const currentPaid = Number(aff.total_paid ?? 0)
    const newPaid = currentPaid + Number(withdrawal.amount)

    const updateRes = await pool.query(
      `UPDATE affiliates SET total_paid = $1, updated_at = NOW() WHERE id = $2 AND total_paid = $3`,
      [newPaid, withdrawal.affiliate_id, currentPaid]
    )
    if ((updateRes.rowCount ?? 0) > 0) break // Success: row was updated
  }

  return { success: true }
}

export async function rejectWithdrawal(
  withdrawalId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const user = await verifyAdmin()
  const pool = getPool()

  try {
    await pool.query(
      `UPDATE affiliate_withdrawals SET status = 'rejected', admin_notes = $1, processed_by = $2, processed_at = NOW() WHERE id = $3`,
      [reason, user.id, withdrawalId]
    )
  } catch {
    return { success: false, error: "Failed to reject withdrawal" }
  }

  return { success: true }
}

// ─── Detail Page Actions ────────────────────────────────────────────────────

export interface AffiliateBalanceAdjustment {
  id: string
  admin_id: string
  type: "credit" | "debit"
  field: "total_earned" | "total_paid"
  amount: number
  balance_before: number
  balance_after: number
  reason: string
  created_at: string
}

export interface AffiliateCommission {
  id: string
  affiliate_id: string
  referral_id: string | null
  amount: number
  type: string
  status: string
  created_at: string
}

export interface AffiliateDetail {
  affiliate: AffiliateRecord
  application: AffiliateApplication | null
  commissions: AffiliateCommission[]
  withdrawals: AffiliateWithdrawal[]
  adjustments: AffiliateBalanceAdjustment[]
}

export async function getAffiliateDetail(
  id: string
): Promise<AffiliateDetail | null> {
  await verifyAdmin()
  const pool = getPool()

  const affRes = await pool.query(
    `SELECT * FROM affiliates WHERE id = $1 LIMIT 1`,
    [id]
  )
  const affiliate = affRes.rows[0] as AffiliateRecord | undefined
  if (!affiliate) return null

  const [appRes, commRes, wdRes, adjRes] = await Promise.all([
    pool.query(`SELECT * FROM affiliate_applications WHERE affiliate_id = $1 LIMIT 1`, [id]),
    pool.query(`SELECT * FROM affiliate_commissions WHERE affiliate_id = $1 ORDER BY created_at DESC LIMIT 50`, [id]),
    pool.query(`SELECT * FROM affiliate_withdrawals WHERE affiliate_id = $1 ORDER BY created_at DESC LIMIT 50`, [id]),
    pool.query(`SELECT * FROM affiliate_balance_adjustments WHERE affiliate_id = $1 ORDER BY created_at DESC LIMIT 50`, [id]),
  ])

  return {
    affiliate,
    application: (appRes.rows[0] as AffiliateApplication) ?? null,
    commissions: (commRes.rows ?? []) as AffiliateCommission[],
    withdrawals: (wdRes.rows ?? []) as AffiliateWithdrawal[],
    adjustments: (adjRes.rows ?? []) as AffiliateBalanceAdjustment[],
  }
}

export async function updateAffiliateCode(
  affiliateId: string,
  newCode: string
): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin()
  const pool = getPool()

  const trimmed = newCode.trim().toUpperCase()

  if (!/^[A-Z0-9-]{4,32}$/.test(trimmed)) {
    return {
      success: false,
      error: "Code must be 4-32 characters, only A-Z, 0-9, and hyphens",
    }
  }

  // Check uniqueness
  const existingRes = await pool.query(
    `SELECT id FROM affiliates WHERE affiliate_code = $1 AND id != $2 LIMIT 1`,
    [trimmed, affiliateId]
  )
  if (existingRes.rows[0]) {
    return { success: false, error: "This code is already in use" }
  }

  try {
    await pool.query(
      `UPDATE affiliates SET affiliate_code = $1, updated_at = NOW() WHERE id = $2`,
      [trimmed, affiliateId]
    )
  } catch {
    return { success: false, error: "Failed to update code" }
  }

  return { success: true }
}

export async function adjustAffiliateBalance(
  affiliateId: string,
  field: "total_earned" | "total_paid",
  type: "credit" | "debit",
  amount: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const user = await verifyAdmin()
  const pool = getPool()

  if (amount <= 0 || amount > 999999.99) {
    return { success: false, error: "Amount must be between 0.01 and 999,999.99" }
  }

  if (!reason || reason.trim().length < 5) {
    return { success: false, error: "Reason must be at least 5 characters" }
  }

  const affRes = await pool.query(
    `SELECT total_earned, total_paid FROM affiliates WHERE id = $1 LIMIT 1`,
    [affiliateId]
  )
  const affiliate = affRes.rows[0] as { total_earned: number; total_paid: number } | undefined
  if (!affiliate) return { success: false, error: "Affiliate not found" }

  const currentValue = Number(affiliate[field]) || 0
  const delta = type === "credit" ? amount : -amount
  const newValue = Math.max(0, currentValue + delta)

  // Update the affiliate balance
  try {
    await pool.query(
      `UPDATE affiliates SET "${field}" = $1, updated_at = NOW() WHERE id = $2`,
      [newValue, affiliateId]
    )
  } catch {
    return { success: false, error: "Failed to update balance" }
  }

  // Record the adjustment in audit trail
  try {
    await pool.query(
      `INSERT INTO affiliate_balance_adjustments (affiliate_id, admin_id, type, field, amount, balance_before, balance_after, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [affiliateId, user.id, type, field, amount, currentValue, newValue, reason.trim()]
    )
  } catch (e) {
    console.error("[admin-affiliates] audit trail error:", e)
  }

  return { success: true }
}

export async function getApplicationCounts(): Promise<{
  pending: number
  approved: number
  rejected: number
  all: number
}> {
  await verifyAdmin()
  const pool = getPool()

  const res = await pool.query(
    `SELECT status, COUNT(*) AS count FROM affiliate_applications GROUP BY status`
  )
  const counts: Record<string, number> = {}
  for (const row of res.rows as { status: string; count: string }[]) {
    counts[row.status] = parseInt(row.count, 10)
  }

  const pending = counts["pending"] ?? 0
  const approved = counts["approved"] ?? 0
  const rejected = counts["rejected"] ?? 0

  return { pending, approved, rejected, all: pending + approved + rejected }
}

export async function reopenApplication(
  applicationId: string
): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin()
  const pool = getPool()

  const appRes = await pool.query(
    `SELECT status FROM affiliate_applications WHERE id = $1 LIMIT 1`,
    [applicationId]
  )
  const app = appRes.rows[0] as { status: string } | undefined
  if (!app) return { success: false, error: "Application not found" }
  if (app.status !== "rejected") {
    return { success: false, error: "Only rejected applications can be reopened" }
  }

  try {
    await pool.query(
      `UPDATE affiliate_applications SET status = 'pending', reviewed_at = NULL, review_notes = NULL WHERE id = $1`,
      [applicationId]
    )
  } catch {
    return { success: false, error: "Failed to reopen application" }
  }

  return { success: true }
}

export async function getAffiliateStats() {
  await verifyAdmin()
  const pool = getPool()

  try {
    const res = await pool.query(`SELECT * FROM admin_get_affiliate_stats()`)
    return res.rows[0] as {
      total_applications: number
      pending_applications: number
      total_affiliates: number
      active_affiliates: number
      total_referrals: number
      total_conversions: number
      total_commissions_earned: number
      total_commissions_paid: number
      pending_withdrawals_count: number
      pending_withdrawals_amount: number
      conversion_rate: number
    } | null
  } catch (e) {
    console.error("[admin-affiliates] getAffiliateStats:", e)
    return null
  }
}
