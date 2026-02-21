/**
 * TDR-08: API route wrapper with CORS headers
 * Wraps API route handlers to automatically add CORS headers
 */

import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders, handleCorsPrelight } from "@/lib/cors";

export async function withCors(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<Response>
): Promise<Response> {
  const origin = request.headers.get("origin");

  // Handle preflight requests (OPTIONS)
  if (request.method === "OPTIONS") {
    return handleCorsPrelight(origin);
  }

  // Call the actual handler
  const response = await handler(request);

  // Add CORS headers to response
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
