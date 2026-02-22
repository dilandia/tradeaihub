import { Metadata } from "next";
import { getStrategies } from "@/app/actions/strategies";
import { StrategiesPageContent } from "@/components/strategies/strategies-page-content";

export const metadata: Metadata = {
  title: "Strategies – TakeZ",
};

export default async function StrategiesPage() {
  const strategies = await getStrategies();

  return <StrategiesPageContent strategies={strategies} />;
}
