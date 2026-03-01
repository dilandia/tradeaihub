"use server"

import { createClient } from "@supabase/supabase-js"
import { verifyAdmin } from "@/lib/admin-auth"
import { sendAffiliateApprovedEmail, sendAffiliateRejectedEmail } from "@/lib/email/send"

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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
  const admin = getAdmin()

  let query = admin
    .from("affiliate_applications")
    .select("*")
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query
  if (error) {
    console.error("[admin-affiliates] getAffiliateApplications:", error)
    return []
  }

  return (data ?? []) as AffiliateApplication[]
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
  const admin = getAdmin()

  // Get application
  const { data: app, error: appError } = await admin
    .from("affiliate_applications")
    .select("*")
    .eq("id", applicationId)
    .single()

  if (appError || !app) {
    return { success: false, error: "Application not found" }
  }

  if (app.status !== "pending") {
    return { success: false, error: "Application is not pending" }
  }

  // Check if affiliate already exists for this email
  const { data: existingAff } = await admin
    .from("affiliates")
    .select("id")
    .eq("email", app.email)
    .maybeSingle()

  if (existingAff) {
    return { success: false, error: "An affiliate with this email already exists" }
  }

  // Lookup user_id by email via profiles table (O(1) indexed query, scales to any user count)
  let userId: string | null = null
  const { data: matchedProfile } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", app.email.trim())
    .maybeSingle()
  if (matchedProfile) {
    userId = matchedProfile.id
  }

  // Generate unique affiliate code
  let code = generateAffiliateCode(app.full_name)
  let attempts = 0
  while (attempts < 5) {
    const { data: existing } = await admin
      .from("affiliates")
      .select("id")
      .eq("affiliate_code", code)
      .maybeSingle()
    if (!existing) break
    code = generateAffiliateCode(app.full_name)
    attempts++
  }

  // Create affiliate record
  const { data: newAffiliate, error: createError } = await admin
    .from("affiliates")
    .insert({
      user_id: userId,
      full_name: app.full_name,
      email: app.email,
      whatsapp: app.whatsapp,
      affiliate_code: code,
      commission_rate: commissionRate,
    })
    .select("id")
    .single()

  if (createError || !newAffiliate) {
    console.error("[admin-affiliates] create affiliate:", createError)
    return { success: false, error: "Failed to create affiliate record" }
  }

  // Update application status
  const { error: updateError } = await admin
    .from("affiliate_applications")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      affiliate_id: newAffiliate.id,
    })
    .eq("id", applicationId)

  if (updateError) {
    console.error("[admin-affiliates] update application:", updateError)
    return { success: false, error: "Failed to update application status" }
  }

  // Send approval email (non-blocking)
  sendAffiliateApprovedEmail({
    to: app.email,
    affiliateName: app.full_name,
    affiliateCode: code,
    commissionRate: commissionRate,
    locale: app.preferred_locale || undefined,
  }).catch((e) => console.error("[admin-affiliates] approval email error:", e))

  return { success: true }
}

export async function rejectApplication(
  applicationId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin()
  const admin = getAdmin()

  // Get application info for email and status check
  const { data: app } = await admin
    .from("affiliate_applications")
    .select("full_name, email, status, preferred_locale")
    .eq("id", applicationId)
    .single()

  if (!app) {
    return { success: false, error: "Application not found" }
  }

  if (app.status !== "pending") {
    return { success: false, error: `Cannot reject: application is already ${app.status}` }
  }

  const { error } = await admin
    .from("affiliate_applications")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      review_notes: reason || null,
    })
    .eq("id", applicationId)

  if (error) {
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
  const admin = getAdmin()

  const { data, error } = await admin
    .from("affiliates")
    .select("*")
    .order("total_earned", { ascending: false })

  if (error) {
    console.error("[admin-affiliates] getAffiliatesList:", error)
    return []
  }

  return (data ?? []) as AffiliateRecord[]
}

export async function toggleAffiliateStatus(
  affiliateId: string
): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin()
  const admin = getAdmin()

  const { data: current, error: fetchError } = await admin
    .from("affiliates")
    .select("is_active")
    .eq("id", affiliateId)
    .single()

  if (fetchError || !current) {
    return { success: false, error: "Affiliate not found" }
  }

  const { error } = await admin
    .from("affiliates")
    .update({ is_active: !current.is_active, updated_at: new Date().toISOString() })
    .eq("id", affiliateId)

  if (error) {
    return { success: false, error: "Failed to update status" }
  }

  return { success: true }
}

export async function updateCommissionRate(
  affiliateId: string,
  rate: number
): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin()
  const admin = getAdmin()

  if (rate < 0 || rate > 1) {
    return { success: false, error: "Rate must be between 0 and 1" }
  }

  const { error } = await admin
    .from("affiliates")
    .update({ commission_rate: rate, updated_at: new Date().toISOString() })
    .eq("id", affiliateId)

  if (error) {
    return { success: false, error: "Failed to update commission rate" }
  }

  return { success: true }
}

export async function getPendingWithdrawals(): Promise<AffiliateWithdrawal[]> {
  await verifyAdmin()
  const admin = getAdmin()

  const { data, error } = await admin
    .from("affiliate_withdrawals")
    .select("*, affiliates(full_name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[admin-affiliates] getPendingWithdrawals:", error)
    return []
  }

  return (data ?? []).map((w: Record<string, unknown>) => ({
    ...(w as unknown as AffiliateWithdrawal),
    affiliate_name: (w.affiliates as { full_name?: string } | null)?.full_name,
    affiliate_email: (w.affiliates as { email?: string } | null)?.email,
  }))
}

export async function processWithdrawal(
  withdrawalId: string,
  txHash: string
): Promise<{ success: boolean; error?: string }> {
  const user = await verifyAdmin()
  const admin = getAdmin()

  if (!txHash.trim()) {
    return { success: false, error: "Transaction hash is required" }
  }

  // Get withdrawal to know the amount and affiliate
  const { data: withdrawal, error: fetchError } = await admin
    .from("affiliate_withdrawals")
    .select("affiliate_id, amount, status")
    .eq("id", withdrawalId)
    .single()

  if (fetchError || !withdrawal) {
    return { success: false, error: "Withdrawal not found" }
  }

  if (withdrawal.status !== "pending") {
    return { success: false, error: "Withdrawal is not in pending status" }
  }

  // Mark withdrawal as completed
  const { error: updateError } = await admin
    .from("affiliate_withdrawals")
    .update({
      status: "completed",
      tx_hash: txHash.trim(),
      processed_by: user.id,
      processed_at: new Date().toISOString(),
    })
    .eq("id", withdrawalId)

  if (updateError) {
    return { success: false, error: "Failed to process withdrawal" }
  }

  // Atomically increment total_paid using optimistic locking to prevent race conditions
  for (let retry = 0; retry < 3; retry++) {
    const { data: aff } = await admin
      .from("affiliates")
      .select("total_paid")
      .eq("id", withdrawal.affiliate_id)
      .single()

    if (!aff) break

    const currentPaid = Number(aff.total_paid ?? 0)
    const { error: paidErr, count } = await admin
      .from("affiliates")
      .update({
        total_paid: currentPaid + Number(withdrawal.amount),
        updated_at: new Date().toISOString(),
      })
      .eq("id", withdrawal.affiliate_id)
      .eq("total_paid", currentPaid)

    if (!paidErr && count && count > 0) break // Success: row was updated
  }

  return { success: true }
}

export async function rejectWithdrawal(
  withdrawalId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const user = await verifyAdmin()
  const admin = getAdmin()

  const { error } = await admin
    .from("affiliate_withdrawals")
    .update({
      status: "rejected",
      admin_notes: reason,
      processed_by: user.id,
      processed_at: new Date().toISOString(),
    })
    .eq("id", withdrawalId)

  if (error) {
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
  const admin = getAdmin()

  const { data: affiliate, error } = await admin
    .from("affiliates")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !affiliate) return null

  const [appResult, commResult, wdResult, adjResult] = await Promise.all([
    admin
      .from("affiliate_applications")
      .select("*")
      .eq("affiliate_id", id)
      .maybeSingle(),
    admin
      .from("affiliate_commissions")
      .select("*")
      .eq("affiliate_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("affiliate_withdrawals")
      .select("*")
      .eq("affiliate_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("affiliate_balance_adjustments")
      .select("*")
      .eq("affiliate_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  return {
    affiliate: affiliate as AffiliateRecord,
    application: (appResult.data as AffiliateApplication) ?? null,
    commissions: (commResult.data ?? []) as AffiliateCommission[],
    withdrawals: (wdResult.data ?? []) as AffiliateWithdrawal[],
    adjustments: (adjResult.data ?? []) as AffiliateBalanceAdjustment[],
  }
}

export async function updateAffiliateCode(
  affiliateId: string,
  newCode: string
): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin()
  const admin = getAdmin()

  const trimmed = newCode.trim().toUpperCase()

  if (!/^[A-Z0-9-]{4,32}$/.test(trimmed)) {
    return {
      success: false,
      error: "Code must be 4-32 characters, only A-Z, 0-9, and hyphens",
    }
  }

  // Check uniqueness
  const { data: existing } = await admin
    .from("affiliates")
    .select("id")
    .eq("affiliate_code", trimmed)
    .neq("id", affiliateId)
    .maybeSingle()

  if (existing) {
    return { success: false, error: "This code is already in use" }
  }

  const { error } = await admin
    .from("affiliates")
    .update({ affiliate_code: trimmed, updated_at: new Date().toISOString() })
    .eq("id", affiliateId)

  if (error) {
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
  const admin = getAdmin()

  if (amount <= 0 || amount > 999999.99) {
    return { success: false, error: "Amount must be between 0.01 and 999,999.99" }
  }

  if (!reason || reason.trim().length < 5) {
    return { success: false, error: "Reason must be at least 5 characters" }
  }

  const { data: affiliate, error: fetchError } = await admin
    .from("affiliates")
    .select("total_earned, total_paid")
    .eq("id", affiliateId)
    .single()

  if (fetchError || !affiliate) {
    return { success: false, error: "Affiliate not found" }
  }

  const currentValue = Number(affiliate[field]) || 0
  const delta = type === "credit" ? amount : -amount
  const newValue = Math.max(0, currentValue + delta)

  // Update the affiliate balance
  const { error: updateError } = await admin
    .from("affiliates")
    .update({ [field]: newValue, updated_at: new Date().toISOString() })
    .eq("id", affiliateId)

  if (updateError) {
    return { success: false, error: "Failed to update balance" }
  }

  // Record the adjustment in audit trail
  const { error: auditError } = await admin
    .from("affiliate_balance_adjustments")
    .insert({
      affiliate_id: affiliateId,
      admin_id: user.id,
      type,
      field,
      amount,
      balance_before: currentValue,
      balance_after: newValue,
      reason: reason.trim(),
    })

  if (auditError) {
    console.error("[admin-affiliates] audit trail error:", auditError)
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
  const admin = getAdmin()

  const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
    admin.from("affiliate_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("affiliate_applications").select("id", { count: "exact", head: true }).eq("status", "approved"),
    admin.from("affiliate_applications").select("id", { count: "exact", head: true }).eq("status", "rejected"),
  ])

  const pending = pendingRes.count ?? 0
  const approved = approvedRes.count ?? 0
  const rejected = rejectedRes.count ?? 0

  return { pending, approved, rejected, all: pending + approved + rejected }
}

export async function reopenApplication(
  applicationId: string
): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin()
  const admin = getAdmin()

  const { data: app } = await admin
    .from("affiliate_applications")
    .select("status")
    .eq("id", applicationId)
    .single()

  if (!app) {
    return { success: false, error: "Application not found" }
  }

  if (app.status !== "rejected") {
    return { success: false, error: "Only rejected applications can be reopened" }
  }

  const { error } = await admin
    .from("affiliate_applications")
    .update({
      status: "pending",
      reviewed_at: null,
      review_notes: null,
    })
    .eq("id", applicationId)

  if (error) {
    return { success: false, error: "Failed to reopen application" }
  }

  return { success: true }
}

export async function getAffiliateStats() {
  await verifyAdmin()
  const admin = getAdmin()

  const { data, error } = await admin.rpc("admin_get_affiliate_stats")
  if (error) {
    console.error("[admin-affiliates] getAffiliateStats:", error)
    return null
  }

  return data as {
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
  }
}
