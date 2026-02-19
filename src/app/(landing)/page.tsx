import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";

const LANDING_HOSTS = ["tradeaihub.com", "www.tradeaihub.com"];

/** Rota raiz: landing em tradeaihub.com/www, redirect em app.tradeaihub.com */
export default async function RootPage() {
  const headersList = await headers();
  const rawHost =
    headersList.get("host") ?? headersList.get("x-forwarded-host") ?? "";
  const host = rawHost.split(",")[0].trim().split(":")[0];

  const isLandingDomain = LANDING_HOSTS.some(
    (h) => host === h || host.endsWith("." + h)
  );

  if (isLandingDomain) {
    return <LandingPage />;
  }

  redirect("/dashboard");
}
