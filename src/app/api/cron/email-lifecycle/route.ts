import { NextRequest, NextResponse } from "next/server"
import { processOnboardingEmails } from "@/lib/email/sequences/onboarding"

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    phase: "sprint-2",
  }

  try {
    // Process onboarding sequence (Sprint 2+)
    results.onboarding = await processOnboardingEmails()

    // Future: conversion, retention, re-engagement processors
    // results.conversion = await processConversionEmails()

    return NextResponse.json({
      success: true,
      message: "Email lifecycle cron processed",
      ...results,
    })
  } catch (error) {
    console.error("[Email Lifecycle Cron] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
