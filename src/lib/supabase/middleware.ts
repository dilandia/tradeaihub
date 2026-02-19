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
  /* Debug: /api/debug-host sempre passa (diagnóstico de Host) */
  if (path === "/api/debug-host") return response;
  /* Host: prioriza headers (Cloudflare/Nginx passam o host real); nextUrl.hostname = localhost atrás de proxy */
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host")?.split(":")[0] ||
    request.nextUrl.hostname ||
    "";
  const isAuthPage = path === "/login" || path === "/register";

  /* tradeaihub.com e www: landing pública em /, auth em app */
  const isLandingDomain =
    host === "tradeaihub.com" || host === "www.tradeaihub.com";
  if (isLandingDomain) {
    if (path === "/") return response;
    /* Login/register na landing: redireciona para app */
    if (path === "/login" || path === "/register") {
      return NextResponse.redirect(
        new URL(path, "https://app.tradeaihub.com")
      );
    }
    /* Outras rotas na landing: 404 ou redireciona para / */
    return NextResponse.redirect(new URL("/", request.url));
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
