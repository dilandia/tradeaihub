import { NextRequest, NextResponse } from "next/server";

const PROVISIONING_BASE =
  "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

/**
 * GET /api/mt-servers?query=icmarkets&version=5
 *
 * Proxy para MetaApi known-mt-servers search.
 * Retorna: { brokers: { [brokerName]: string[] } }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get("query")?.trim();
  const version = searchParams.get("version") ?? "5"; // mt4 = 4, mt5 = 5

  if (!query || query.length < 2) {
    return NextResponse.json({ brokers: {} });
  }

  const token = process.env.METAAPI_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "METAAPI_TOKEN not configured" },
      { status: 500 }
    );
  }

  try {
    const url = `${PROVISIONING_BASE}/known-mt-servers/${version}/search?query=${encodeURIComponent(query)}`;

    // Desabilitar verificação SSL para MetaApi (cert issue no Windows/Node.js)
    const prevTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    const res = await fetch(url, {
      headers: {
        "auth-token": token,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    // Restaurar
    if (prevTls === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTls;

    if (!res.ok) {
      const body = await res.text();
      console.error("[mt-servers] MetaApi error:", res.status, body);
      return NextResponse.json({ brokers: {} });
    }

    const data = await res.json();

    // data = { "Raw Trading Ltd": ["ICMarketsSC-Demo", "ICMarketsSC-MT5"], ... }
    return NextResponse.json({ brokers: data });
  } catch (err) {
    console.error("[mt-servers]", err);
    return NextResponse.json({ brokers: {} });
  }
}
