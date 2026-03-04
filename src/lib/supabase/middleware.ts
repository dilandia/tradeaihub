import { NextResponse, type NextRequest } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  token_type?: string;
  user?: Record<string, unknown>;
}

// SupabaseSession used in parseSessionFromCookies

interface JwtPayload {
  sub?: string;
  email?: string;
  exp?: number;
  app_metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Emergency redirect: clears all sb-* cookies and forces browser to clear
 * cache, cookies, and storage. Redirects to /login.
 */
function emergencyClearAndRedirect(request: NextRequest): NextResponse {
  const clearResponse = NextResponse.redirect(new URL("/login", request.url));
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith("sb-")) {
      clearResponse.cookies.delete(name);
    }
  });
  clearResponse.headers.set("Clear-Site-Data", '"cache", "cookies", "storage"');
  return clearResponse;
}

/**
 * Decode a base64url string to a regular string.
 * Works in both Edge Runtime and Node.js.
 */
function base64urlDecode(s: string): string {
  // Convert base64url → base64, then decode
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (padded.length % 4)) % 4);
  return atob(padded + padding);
}

/**
 * Parse the JWT payload without verifying the signature (local decode only).
 * Used for routing decisions — actual validation happens in server components.
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(base64urlDecode(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Find and decode the Supabase session from request cookies.
 * Handles both direct and chunked cookie formats used by @supabase/ssr.
 * Returns null if no valid session structure is found.
 *
 * Formats supported:
 * - `sb-xxx-auth-token` = raw JSON string
 * - `sb-xxx-auth-token` = "base64-{base64url}" prefixed string
 * - `sb-xxx-auth-token.0`, `.1`, ... = chunked (reassemble then decode)
 */
function parseSessionFromCookies(
  cookiesList: Array<{ name: string; value: string }>
): { session: SupabaseSession; cookieName: string } | null {
  const sbAuthCookies = cookiesList.filter(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token")
  );

  if (sbAuthCookies.length === 0) return null;

  // Find the base cookie name (without chunk suffix)
  const directCookie = sbAuthCookies.find((c) => !c.name.match(/\.\d+$/));
  const chunks = sbAuthCookies
    .filter((c) => c.name.match(/\.\d+$/))
    .sort((a, b) => a.name.localeCompare(b.name));

  let rawValue: string | null = null;
  let cookieName: string = "";

  if (directCookie) {
    rawValue = directCookie.value;
    cookieName = directCookie.name;
  } else if (chunks.length > 0) {
    rawValue = chunks.map((c) => c.value).join("");
    // Derive base name from first chunk (e.g. "sb-xxx-auth-token.0" → "sb-xxx-auth-token")
    cookieName = chunks[0].name.replace(/\.\d+$/, "");
  }

  if (!rawValue || !cookieName) return null;

  // Decode the value
  let decoded = rawValue;
  if (decoded.startsWith("base64-")) {
    try {
      decoded = base64urlDecode(decoded.slice(7));
    } catch {
      return null;
    }
  }

  try {
    const session = JSON.parse(decoded) as SupabaseSession;
    if (!session.access_token || !session.refresh_token) return null;
    return { session, cookieName };
  } catch {
    return null;
  }
}

// NOTE: refreshTokenDirect and setSessionCookies were removed.
// Middleware MUST NOT make network calls (Edge Runtime connection pool exhaustion → 502).
// Token refresh is now handled client-side via /auth/refresh page.

// ─── Main middleware function ─────────────────────────────────────────────────

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
      maxAge: 30 * 24 * 60 * 60,
    });
    return redirectResponse;
  }
  // ─────────────────────────────────────────────────────────────────────────

  const path = request.nextUrl.pathname;
  const rawHost =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    request.nextUrl.hostname ||
    "";
  const host = rawHost.split(":")[0];

  const isProdLandingDomain =
    host === "tradeaihub.com" || host === "www.tradeaihub.com";
  const isLocalhost = host === "localhost" || host === "127.0.0.1";
  const isProd = host.includes("tradeaihub.com");

  const landingPublicPaths = [
    "/",
    "/about",
    "/contact",
    "/blog",
    "/privacy",
    "/terms",
    "/affiliates",
  ];
  const isLandingPublic =
    landingPublicPaths.includes(path) ||
    path.startsWith("/blog/") ||
    path === "/robots.txt" ||
    path === "/sitemap.xml";

  const isApiRoute = path.startsWith("/api/");
  const isAuthPage =
    path === "/login" ||
    path === "/register" ||
    path === "/forgot-password" ||
    path === "/reset-password" ||
    path === "/auth/refresh";
  const isAuthCallback = path === "/auth/callback";

  const isSelfAuthApi =
    path.startsWith("/api/cron/") ||
    path.startsWith("/api/webhooks/") ||
    path.startsWith("/api/stripe/webhook") ||
    path === "/api/affiliates/apply" ||
    path === "/api/health";

  // ── FAST PATH: Landing domain — never needs auth ────────────────────────
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
        return NextResponse.redirect(
          new URL(path, "https://app.tradeaihub.com")
        );
      }
      return NextResponse.redirect(new URL(path, "https://app.tradeaihub.com"));
    }
  }

  // Self-auth API routes (cron, webhooks): always pass through
  if (isSelfAuthApi) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  // ── LOCAL SESSION PARSE: No network calls, no locks, no 502 ────────────
  // We decode the JWT directly from cookies to determine auth state.
  // This avoids the @supabase/ssr GoTrueClient internal lock that was causing
  // _emitInitialSession to hold the lock while making slow network requests,
  // causing getUser() to wait 9s+ and Cloudflare to return 502.

  const parsed = parseSessionFromCookies(request.cookies.getAll());

  // No session at all (includes malformed/unparseable cookies)
  if (!parsed) {
    if (isAuthPage || isAuthCallback) {
      return NextResponse.next({ request: { headers: request.headers } });
    }
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Clear any bad sb-* cookies to avoid redirect loops with malformed cookies
    return emergencyClearAndRedirect(request);
  }

  const { session } = parsed;
  const payload = decodeJwtPayload(session.access_token);

  // Invalid JWT structure in cookie
  if (!payload || !payload.sub) {
    console.warn("[Middleware] Invalid JWT in cookie — clearing");
    return emergencyClearAndRedirect(request);
  }

  const isExpired =
    typeof payload.exp !== "number" || payload.exp * 1000 < Date.now();

  // Token expired — redirect to /auth/refresh page for client-side refresh.
  // CRITICAL: Do NOT make network calls from middleware (Edge Runtime connection
  // pool exhaustion causes accumulated hanging fetches → 502 cascade).
  if (isExpired) {
    if (isAuthPage || isAuthCallback) {
      // Already on an auth page — let it through (avoid redirect loop)
      return NextResponse.next({ request: { headers: request.headers } });
    }
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const returnPath = request.nextUrl.pathname + request.nextUrl.search;
    const refreshUrl = new URL("/auth/refresh", request.url);
    refreshUrl.searchParams.set("next", returnPath);
    return NextResponse.redirect(refreshUrl);
  }

  // Token is valid — decode user locally (zero network calls)
  const user = {
    id: payload.sub!,
    email: (payload.email as string) ?? "",
    app_metadata: (payload.app_metadata as Record<string, unknown>) ?? {},
  };

  // ── Routing decisions (user is always authenticated at this point) ─────────

  // Logged-in user on auth page → dashboard
  if (isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Admin protection
  if (path.startsWith("/admin")) {
    const isAdmin =
      user.app_metadata?.role === "admin" ||
      user.app_metadata?.role === "super_admin";
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // app.tradeaihub.com: root with logged-in user → dashboard
  if (path === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next({ request: { headers: request.headers } });
}
