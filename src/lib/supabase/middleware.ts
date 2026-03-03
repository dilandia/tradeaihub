import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Helper: create an emergency redirect to /login, clearing all sb-* cookies
 * and forcing browser to purge cache + cookies + storage.
 * Used as a safety net for ANY unhandled auth/cookie issue.
 */
function emergencyClearAndRedirect(request: NextRequest): NextResponse {
  const clearResponse = NextResponse.redirect(new URL("/login", request.url));
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith("sb-")) {
      clearResponse.cookies.delete(name);
    }
  });
  // Nuclear: clear cache + cookies + storage for this origin
  // This is the definitive fix — forces fresh state on next visit
  clearResponse.headers.set("Clear-Site-Data", '"cache", "cookies", "storage"');
  return clearResponse;
}

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

  const path = request.nextUrl.pathname;
  /* Host: prioriza headers; remove porta para comparar (localhost:3000 → localhost) */
  const rawHost =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    request.nextUrl.hostname ||
    "";
  const host = rawHost.split(":")[0];

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

  const isAuthPage = path === "/login" || path === "/register" || path === "/forgot-password" || path === "/reset-password";
  const isAuthCallback = path === "/auth/callback";

  // ── FAST PATH: Landing domain routes that NEVER need auth ──
  // These return BEFORE any Supabase call, so corrupted cookies can't crash them
  if (isProdLandingDomain || isLocalhost) {
    if (path === "/") {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = "/landing-internal";
      return NextResponse.rewrite(rewriteUrl);
    }
    if (isLandingPublic) {
      return NextResponse.next({ request: { headers: request.headers } });
    }
    if (isApiRoute) {
      /* Falls through to auth check below */
    } else if (isProdLandingDomain) {
      if (isAuthPage) {
        return NextResponse.redirect(new URL(path, "https://app.tradeaihub.com"));
      }
      return NextResponse.redirect(new URL(path, "https://app.tradeaihub.com"));
    }
  }

  // ── FAST PATH: Auth pages and callback don't need user check when no cookies ──
  // If user has NO supabase cookies at all, skip the Supabase call entirely
  const hasSupabaseCookies = request.cookies.getAll().some(({ name }) => name.startsWith("sb-"));

  if (!hasSupabaseCookies) {
    // No auth cookies → user is definitely not logged in
    if (isAuthPage || isAuthCallback) {
      return NextResponse.next({ request: { headers: request.headers } });
    }
    // API routes with their own auth
    const isSelfAuthApi =
      path.startsWith("/api/cron/") ||
      path.startsWith("/api/webhooks/") ||
      path.startsWith("/api/stripe/webhook") ||
      path === "/api/affiliates/apply" ||
      path === "/api/health";
    if (isApiRoute && !isSelfAuthApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isSelfAuthApi) {
      return NextResponse.next({ request: { headers: request.headers } });
    }
    // Any other path without cookies → go to login (no Supabase call needed)
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── AUTH PATH: User has cookies, validate with Supabase ──
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return response;
  }

  let supabase;
  try {
    supabase = createServerClient(url, anonKey, {
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
  } catch (error) {
    // createServerClient crashed (corrupted cookies) — emergency clear
    console.error("[Middleware] createServerClient crashed:", error);
    return emergencyClearAndRedirect(request);
  }

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    user = data.user;
  } catch {
    // Token stale — try refresh before invalidating
    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.user) throw refreshError ?? new Error("No user after refresh");
      user = refreshData.user;
    } catch {
      // Both getUser and refresh failed — cookies are dead
      if (!isAuthPage && !isAuthCallback && !isApiRoute) {
        return emergencyClearAndRedirect(request);
      }
      // For auth pages and API routes, continue without user
    }
  }

  // ── Routing decisions ──

  // Logged-in user on auth page → dashboard
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // API routes with their own auth
  const isSelfAuthApi =
    path.startsWith("/api/cron/") ||
    path.startsWith("/api/webhooks/") ||
    path.startsWith("/api/stripe/webhook") ||
    path === "/api/affiliates/apply" ||
    path === "/api/health";

  // API routes: 401 JSON for unauthenticated
  if (isApiRoute && !user && !isSelfAuthApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Protected routes: redirect to login if no user
  if (!isAuthPage && !isAuthCallback && !isSelfAuthApi && !user) {
    return emergencyClearAndRedirect(request);
  }

  // Admin protection
  if (path.startsWith("/admin") && user) {
    const isAdmin =
      user.app_metadata?.role === "admin" ||
      user.app_metadata?.role === "super_admin";
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // app.tradeaihub.com: root with logged-in user → dashboard
  if (path === "/" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
