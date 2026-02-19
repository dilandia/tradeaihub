import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint temporário para debug: verificar qual Host o servidor recebe.
 * Acesse: https://tradeaihub.com/api/debug-host ou https://app.tradeaihub.com/api/debug-host
 * REMOVER em produção após resolver o problema.
 */
export async function GET(req: NextRequest) {
  const hostHeader = req.headers.get("host") ?? "";
  const xForwardedHost = req.headers.get("x-forwarded-host") ?? "";
  const rawHost = xForwardedHost.split(",")[0]?.trim() || hostHeader || "";
  const host = rawHost.split(":")[0]; // remove porta

  const deveMostrarLanding =
    host === "tradeaihub.com" ||
    host === "www.tradeaihub.com" ||
    host === "localhost" ||
    host === "127.0.0.1";

  return NextResponse.json({
    message: "Debug - remover após resolver",
    host: hostHeader,
    "x-forwarded-host": xForwardedHost,
    hostNormalizado: host,
    deveMostrarLanding,
  });
}
