import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionSection } from "@/components/settings/subscription-section";
import { CreditsSection } from "@/components/settings/credits-section";
import { getUserPlan } from "@/lib/plan";

export const metadata: Metadata = {
  title: "Assinatura – TakeZ",
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
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Assinatura</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie seu plano e desbloqueie funcionalidades avançadas.
        </p>
      </div>
      <SubscriptionSection
        currentPlan={currentPlan}
        memberSince={memberSince}
      />
      <CreditsSection />
    </div>
  );
}
