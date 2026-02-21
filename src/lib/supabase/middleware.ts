import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
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
  const isAuthPage = path === "/login" || path === "/register";

  /* tradeaihub.com, www: domínio de landing em prod */
  const isProdLandingDomain =
    host === "tradeaihub.com" || host === "www.tradeaihub.com";
  /* localhost: em dev serve landing E app no mesmo host */
  const isLocalhost = host === "localhost" || host === "127.0.0.1";

  if (isProdLandingDomain || isLocalhost) {
    if (path === "/") return response;
    /* Login/register: em prod landing redireciona para app */
    if ((path === "/login" || path === "/register") && isProdLandingDomain) {
      return NextResponse.redirect(
        new URL(path, "https://app.tradeaihub.com")
      );
    }
    /* Em prod landing: rotas do app (dashboard, trades, etc) redirecionam para app.tradeaihub.com */
    if (isProdLandingDomain && path !== "/login" && path !== "/register") {
      return NextResponse.redirect(new URL(path, "https://app.tradeaihub.com"));
    }
    /* Em localhost: permite todas as rotas (/, /login, /register, /dashboard, etc) - segue para checagens de auth */
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isAuthPage && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  /* app.tradeaihub.com: rota raiz com usuário logado → dashboard */
  if (path === "/" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
