import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "TRADE AI HUB – Intelligence on Your Side",
  description:
    "Not just a dashboard. Specialized AI agents analyze your trades, identify patterns, and suggest improvements. Much more than reports — intelligence working for your performance.",
};

export default function LandingInternalPage() {
  return <LandingPage />;
}
