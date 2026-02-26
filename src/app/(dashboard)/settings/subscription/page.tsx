import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionSection } from "@/components/settings/subscription-section";
import { CreditsSection } from "@/components/settings/credits-section";
import { BillingInfoCard } from "@/components/settings/billing-info-card";
import { getUserPlan } from "@/lib/plan";

export const metadata: Metadata = {
  title: "Subscription – Trade AI Hub",
};

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const currentPlan = await getUserPlan(user.id);
  const memberSince = user.created_at;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <BillingInfoCard currentPlan={currentPlan} memberSince={memberSince} />
      <SubscriptionSection
        currentPlan={currentPlan}
        memberSince={memberSince}
      />
      <CreditsSection />
    </div>
  );
}
