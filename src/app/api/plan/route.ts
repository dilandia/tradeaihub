import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPlanInfo } from "@/lib/plan";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Extract userId from Supabase session cookie without a network call.
 * Fallback when supabase.auth.getUser() is slow or unreachable.
 * Same cookie parsing logic as middleware.ts.
 */
function getUserIdFromCookie(
  cookieList: Array<{ name: string; value: string }>
): string | null {
  try {
    const sbCookies = cookieList.filter(
      (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token")
    );
    if (sbCookies.length === 0) return null;

    const direct = sbCookies.find((c) => !c.name.match(/\.\d+$/));
    const chunks = sbCookies
      .filter((c) => c.name.match(/\.\d+$/))
      .sort((a, b) => a.name.localeCompare(b.name));

    let raw = direct?.value ?? (chunks.length > 0 ? chunks.map((c) => c.value).join("") : null);
    if (!raw) return null;

    if (raw.startsWith("base64-")) {
      const b64 = raw.slice(7).replace(/-/g, "+").replace(/_/g, "/");
      raw = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    }

    const session = JSON.parse(raw) as { access_token?: string };
    if (!session?.access_token) return null;

    const parts = session.access_token.split(".");
    if (parts.length !== 3) return null;

    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(
      atob(padded + "=".repeat((4 - (padded.length % 4)) % 4))
    ) as { sub?: string; exp?: number };

    // Reject expired tokens
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/**
 * GET /api/plan
 * Retorna o PlanInfo do usuário autenticado.
 * Usado pelo PlanContext no client.
 *
 * Resilience: se supabase.auth.getUser() falhar (rede lenta / Supabase hiccup),
 * faz fallback para leitura local do JWT no cookie — mesma abordagem do middleware.
 */
export async function GET() {
  const cookieStore = await cookies();
  let userId: string | null = null;

  // Primary: verify with Supabase (also handles token refresh via cookie)
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) userId = data.user.id;
  } catch {
    // Network call failed — fall through to cookie fallback
  }

  // Fallback: decode JWT from cookie locally (no network call, no lock contention)
  if (!userId) {
    userId = getUserIdFromCookie(cookieStore.getAll());
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planInfo = await getPlanInfo(userId);
  if (!planInfo) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const res = NextResponse.json(planInfo);
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}
