import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Reports – TakeZ",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ import?: string; account?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.account) qs.set("account", params.account);
  if (params.import) qs.set("import", params.import);
  const query = qs.toString();
  redirect(`/reports/performance${query ? `?${query}` : ""}`);
}
