import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LANDING_HOSTS = ["tradeaihub.com", "www.tradeaihub.com", "localhost", "127.0.0.1"];
const APP_HOST = "app.tradeaihub.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.tradeaihub.com";

function isLandingHost(host: string): boolean {
  const h = host.replace(/:\d+$/, "");
  return LANDING_HOSTS.includes(h) || (!h.includes("app.") && h !== APP_HOST);
}

export async function updateSession(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const path = request.nextUrl.pathname;

  // Landing hosts: tradeaihub.com, www, localhost (para dev)
  if (isLandingHost(host)) {
    // Login/Register na landing → redirecionar para o app
    if (path === "/login" || path === "/register") {
      const target = new URL(path, APP_URL);
      return NextResponse.redirect(target);
    }
    // Raiz → reescrever para landing (conteúdo de marketing)
    if (path === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/landing-internal";
      return NextResponse.rewrite(url);
    }
    // Outras rotas na landing: permitir (ex: /landing-internal após rewrite)
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }

  // App host: comportamento atual (auth obrigatório)
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

  const isAuthPage = path === "/login" || path === "/register";

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Evitar rota / quebrada (clientReferenceManifest) - redirecionar para /dashboard
  if (path === "/" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isAuthPage && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}
