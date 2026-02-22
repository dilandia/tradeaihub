import { Metadata } from "next";
import {
  getOrCreateReferralCode,
  getReferralStats,
  getReferralHistory,
} from "@/app/actions/referrals";
import { ReferralsPageContent } from "@/components/referrals/referrals-page-content";

export const metadata: Metadata = {
  title: "Referrals – TakeZ",
};

export default async function ReferralsPage() {
  const [code, stats, history] = await Promise.all([
    getOrCreateReferralCode(),
    getReferralStats(),
    getReferralHistory(),
  ]);

  return (
    <ReferralsPageContent
      referralCode={code}
      stats={stats}
      history={history}
    />
  );
}
