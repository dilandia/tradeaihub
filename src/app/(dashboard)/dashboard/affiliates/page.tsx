import type { Metadata } from "next"
import { getAffiliateDashboard, getAffiliateStatus, getApplicationStatus } from "@/app/actions/affiliates"
import { AffiliateDashboardContent } from "@/components/affiliates/affiliate-dashboard-content"

export const metadata: Metadata = {
  title: "Affiliates – TakeZ",
}

export default async function AffiliateDashboardPage() {
  const [statusResult, dashboardResult, appStatusResult] = await Promise.allSettled([
    getAffiliateStatus(),
    getAffiliateDashboard(),
    getApplicationStatus(),
  ])

  const status = statusResult.status === "fulfilled" ? statusResult.value : null
  const dashboard = dashboardResult.status === "fulfilled" ? dashboardResult.value : null
  const applicationStatus = appStatusResult.status === "fulfilled" ? appStatusResult.value : null

  return (
    <AffiliateDashboardContent
      isAffiliate={!!status}
      dashboard={dashboard}
      applicationStatus={applicationStatus}
    />
  )
}
