import { NextResponse, type NextRequest } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  token_type?: string;
  user?: Record<string, unknown>;
}

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

/**
 * Refresh the access token directly via Supabase REST API.
 * Does NOT use @supabase/ssr to avoid the internal GoTrueClient lock.
 * Uses Promise.race with a 5-second timeout to prevent hangs on both
 * the fetch() and the response.json() calls.
 */
async function refreshTokenDirect(
  refreshToken: string,
  supabaseUrl: string,
  anonKey: string
): Promise<SupabaseSession | null> {
  // Timeout covers both fetch() and response.json() via Promise.race
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), 5000)
  );

  const fetchAttempt = (async (): Promise<SupabaseSession | null> => {
    try {
      const response = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: anonKey,
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );
      if (!response.ok) return null;
      const data = (await response.json()) as SupabaseSession;
      if (!data.access_token || !data.refresh_token) return null;
      return data;
    } catch {
      return null;
    }
  })();

  return Promise.race([fetchAttempt, timeout]);
}

/**
 * Store a Supabase session in the response cookies.
 * Splits into chunks if the JSON exceeds 3800 bytes (cookie size limit ~4096 bytes).
 */
function setSessionCookies(
  response: NextResponse,
  cookieName: string,
  session: SupabaseSession,
  isProd: boolean
): void {
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year (Supabase manages actual expiry)
  };

  const sessionJson = JSON.stringify(session);

  // Clear old chunked cookies first (in case they existed)
  for (let i = 0; i < 10; i++) {
    response.cookies.delete(`${cookieName}.${i}`);
  }

  if (sessionJson.length <= 3800) {
    response.cookies.set(cookieName, sessionJson, cookieOptions);
  } else {
    // Chunk the session into pieces
    response.cookies.delete(cookieName);
    const chunkSize = 3800;
    for (let i = 0; i * chunkSize < sessionJson.length; i++) {
      response.cookies.set(
        `${cookieName}.${i}`,
        sessionJson.slice(i * chunkSize, (i + 1) * chunkSize),
        cookieOptions
      );
    }
  }
}

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
    path === "/reset-password";
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anonKey) {
    // Env vars missing — can't validate, pass through
    return NextResponse.next({ request: { headers: request.headers } });
  }

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

  const { session, cookieName } = parsed;
  const payload = decodeJwtPayload(session.access_token);

  // Invalid JWT structure in cookie
  if (!payload || !payload.sub) {
    console.warn("[Middleware] Invalid JWT in cookie — clearing");
    return emergencyClearAndRedirect(request);
  }

  let user: {
    id: string;
    email: string;
    app_metadata: Record<string, unknown>;
  } | null = null;

  const isExpired =
    typeof payload.exp !== "number" || payload.exp * 1000 < Date.now();

  if (!isExpired) {
    // Token is still valid — use local data (no network call)
    user = {
      id: payload.sub,
      email: (payload.email as string) ?? "",
      app_metadata: (payload.app_metadata as Record<string, unknown>) ?? {},
    };
  } else {
    // Token expired — try to refresh directly (bypasses @supabase/ssr lock)
    console.log("[Middleware] Access token expired, refreshing directly...");
    const newSession = await refreshTokenDirect(
      session.refresh_token,
      url,
      anonKey
    );

    if (newSession) {
      const newPayload = decodeJwtPayload(newSession.access_token);
      if (newPayload?.sub) {
        user = {
          id: newPayload.sub,
          email: (newPayload.email as string) ?? "",
          app_metadata:
            (newPayload.app_metadata as Record<string, unknown>) ?? {},
        };
        // Store refreshed session in cookies for subsequent requests
        const response = NextResponse.next({ request: { headers: request.headers } });
        setSessionCookies(response, cookieName, newSession, isProd);
        // Apply routing decisions below before returning
        // (we'll return this response after routing checks)

        // Apply routing logic
        if (isAuthPage) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        if (path === "/" && user) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        if (path.startsWith("/admin")) {
          const isAdmin =
            user.app_metadata?.role === "admin" ||
            user.app_metadata?.role === "super_admin";
          if (!isAdmin) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
          }
        }
        return response;
      }
    }

    // Refresh failed — session is dead
    console.warn("[Middleware] Token refresh failed — clearing session");
    if (!isAuthPage && !isAuthCallback && !isApiRoute) {
      return emergencyClearAndRedirect(request);
    }
    // Auth pages and API routes: continue without user
  }

  // ── Routing decisions ─────────────────────────────────────────────────────

  // Logged-in user on auth page → dashboard
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // API routes: 401 JSON for unauthenticated
  if (isApiRoute && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Protected routes: redirect to login if no user
  if (!isAuthPage && !isAuthCallback && !user) {
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

  return NextResponse.next({ request: { headers: request.headers } });
}
