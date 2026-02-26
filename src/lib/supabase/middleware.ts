import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // ── Affiliate tracking: ?aff=CODE sets a 30-day httpOnly cookie ──────────
  const rawAffCode = request.nextUrl.searchParams.get("aff");
  const affiliateCode = rawAffCode?.toUpperCase();
  if (affiliateCode && /^[A-Z0-9-]{6,30}$/.test(affiliateCode)) {
    const cleanUrl = new URL(request.nextUrl);
    cleanUrl.searchParams.delete("aff");
    const redirectResponse = NextResponse.redirect(cleanUrl);
    const isProd = request.nextUrl.hostname.includes("tradeaihub.com");
    redirectResponse.cookies.set("affiliate_ref", affiliateCode, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      ...(isProd ? { domain: ".tradeaihub.com" } : {}),
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    return redirectResponse;
  }
  // ─────────────────────────────────────────────────────────────────────────

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  /* Host: prioriza headers; remove porta para comparar (localhost:3000 → localhost) */
  const rawHost =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    request.nextUrl.hostname ||
    "";
  const host = rawHost.split(":")[0];
  const isAuthPage = path === "/login" || path === "/register" || path === "/forgot-password" || path === "/reset-password";
  const isAuthCallback = path === "/auth/callback";

  /* tradeaihub.com, www: domínio de landing em prod */
  const isProdLandingDomain =
    host === "tradeaihub.com" || host === "www.tradeaihub.com";
  /* localhost: em dev serve landing E app no mesmo host */
  const isLocalhost = host === "localhost" || host === "127.0.0.1";

  /* Rotas públicas da landing (não requerem auth) */
  const landingPublicPaths = ["/", "/about", "/contact", "/blog", "/privacy", "/terms", "/affiliates"];
  const isLandingPublic = landingPublicPaths.includes(path) || path.startsWith("/blog/") || path === "/robots.txt" || path === "/sitemap.xml";

  /* Rotas de API nunca devem ser redirecionadas (evita CORS cross-origin) */
  const isApiRoute = path.startsWith("/api/");

  if (isProdLandingDomain || isLocalhost) {
    if (isLandingPublic) return response;
    /* API routes: processar diretamente, nunca redirecionar */
    if (isApiRoute) {
      /* Segue para checagens de auth abaixo */
    } else if (isProdLandingDomain) {
      /* Login/register: redireciona para app */
      if (path === "/login" || path === "/register" || path === "/forgot-password" || path === "/reset-password") {
        return NextResponse.redirect(
          new URL(path, "https://app.tradeaihub.com")
        );
      }
      /* Rotas do app (dashboard, trades, etc) redirecionam para app.tradeaihub.com */
      return NextResponse.redirect(new URL(path, "https://app.tradeaihub.com"));
    }
    /* Em localhost: permite todas as rotas */
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  /* API routes with their own auth (cron secrets, webhook signatures) — skip middleware auth */
  const isSelfAuthApi =
    path.startsWith("/api/cron/") ||
    path.startsWith("/api/webhooks/") ||
    path.startsWith("/api/stripe/webhook") ||
    path === "/api/affiliates/apply"; // public: no auth needed for applications

  /* API routes: return 401 JSON instead of redirect (avoids CORS cross-origin) */
  if (isApiRoute && !user && !isSelfAuthApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthPage && !isAuthCallback && !isSelfAuthApi && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  /* app.tradeaihub.com: rota raiz com usuário logado → dashboard */
  if (path === "/" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
