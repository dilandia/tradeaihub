import { Metadata } from "next";
import { StrategiesComingSoon } from "@/components/strategies/strategies-coming-soon";

export const metadata: Metadata = {
  title: "Strategies – TakeZ",
};

export default function StrategiesPage() {
  return <StrategiesComingSoon />;
}
