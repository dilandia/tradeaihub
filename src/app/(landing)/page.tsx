import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { AppUrlProvider } from "@/contexts/app-url-context";

const LANDING_HOSTS = ["tradeaihub.com", "www.tradeaihub.com"];
const DEV_LANDING_HOSTS = ["localhost", "127.0.0.1"];

/** Rota raiz: landing em tradeaihub.com/www (e localhost em dev), redirect em app */
export default async function RootPage() {
  const headersList = await headers();
  const rawHost =
    headersList.get("host") ?? headersList.get("x-forwarded-host") ?? "";
  const hostPart = rawHost.split(",")[0].trim();
  const host = hostPart.split(":")[0];
  const isDev = process.env.NODE_ENV === "development";

  const isLandingDomain =
    LANDING_HOSTS.some((h) => host === h || host.endsWith("." + h)) ||
    (isDev && DEV_LANDING_HOSTS.some((h) => host === h || host.startsWith(h + ":")));

  if (isLandingDomain) {
    const isLocalhost = host === "localhost" || host === "127.0.0.1";
    const appUrl = isLocalhost
      ? `http://${hostPart}`
      : "https://app.tradeaihub.com";

    return (
      <AppUrlProvider appUrl={appUrl}>
        <LandingPage />
      </AppUrlProvider>
    );
  }

  redirect("/dashboard");
}
