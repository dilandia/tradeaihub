"use server"

import { createClient } from "@/lib/supabase/server"

export type NotificationPrefs = {
  emailReportsEnabled: boolean
  emailReportFrequency: "weekly" | "monthly"
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return { emailReportsEnabled: false, emailReportFrequency: "weekly" }

  const { data } = await supabase
    .from("profiles")
    .select("email_reports_enabled, email_report_frequency")
    .eq("id", user.id)
    .single()

  return {
    emailReportsEnabled: data?.email_reports_enabled ?? false,
    emailReportFrequency:
      (data?.email_report_frequency as "weekly" | "monthly") ?? "weekly",
  }
}

export async function updateNotificationPrefs(
  prefs: NotificationPrefs
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { error } = await supabase
    .from("profiles")
    .update({
      email_reports_enabled: prefs.emailReportsEnabled,
      email_report_frequency: prefs.emailReportFrequency,
    })
    .eq("id", user.id)

  if (error) {
    console.error("[updateNotificationPrefs]", error.message)
    return { success: false, error: error.message }
  }
  return { success: true }
}
