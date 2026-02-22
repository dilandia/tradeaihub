import posthog from "posthog-js"

export const analytics = {
  // Landing
  ctaClicked: (location: string) => posthog.capture("cta_clicked", { location }),
  pricingToggled: (period: "monthly" | "annual") => posthog.capture("pricing_toggled", { period }),

  // Auth
  signupStarted: () => posthog.capture("signup_started"),
  signupCompleted: () => posthog.capture("signup_completed"),
  loginCompleted: () => posthog.capture("login_completed"),

  // Core product
  tradeImported: (count: number) => posthog.capture("trade_imported", { count }),
  aiInsightGenerated: (type: string) => posthog.capture("ai_insight_generated", { type }),
  reportViewed: (reportType: string) => posthog.capture("report_viewed", { report_type: reportType }),

  // Monetization
  upgradeClicked: (from: string) => posthog.capture("upgrade_clicked", { from }),
  checkoutStarted: (plan: string, period: string) => posthog.capture("checkout_started", { plan, period }),
}
