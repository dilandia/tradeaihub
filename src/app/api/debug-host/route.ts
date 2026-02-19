import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint temporário para debug: verificar qual Host o servidor recebe.
 * Acesse: https://tradeaihub.com/api/debug-host ou https://app.tradeaihub.com/api/debug-host
 * REMOVER em produção após resolver o problema.
 */
export async function GET(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const xForwardedHost = req.headers.get("x-forwarded-host") ?? "";
  const hostname = req.nextUrl.hostname;

  return NextResponse.json({
    message: "Debug - remover após resolver",
    host,
    "x-forwarded-host": xForwardedHost,
    "nextUrl.hostname": hostname,
    "deveMostrarLanding":
      hostname === "tradeaihub.com" || hostname === "www.tradeaihub.com",
  });
}
