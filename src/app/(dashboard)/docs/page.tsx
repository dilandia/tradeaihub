import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { DocsPage } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Documentation – Trade AI Hub",
  description: "Complete guide to using Trade AI Hub. Learn about importing trades, AI features, plans, and more.",
};

export default async function Docs() {
  const { user } = await getServerSession();
  if (!user) redirect("/login");

  return <DocsPage />;
}
