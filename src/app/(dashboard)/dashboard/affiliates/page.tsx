import type { Metadata } from "next"
import { getAffiliateDashboard, getAffiliateStatus } from "@/app/actions/affiliates"
import { AffiliateDashboardContent } from "@/components/affiliates/affiliate-dashboard-content"

export const metadata: Metadata = {
  title: "Affiliates – TakeZ",
}

export default async function AffiliateDashboardPage() {
  const [status, dashboard] = await Promise.all([
    getAffiliateStatus(),
    getAffiliateDashboard(),
  ])

  return (
    <AffiliateDashboardContent
      isAffiliate={!!status}
      dashboard={dashboard}
    />
  )
}
