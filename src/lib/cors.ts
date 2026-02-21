/**
 * TDR-08: CORS configuration
 * Restricts API access to authorized origins only
 */

// List of allowed origins - update based on deployment
const ALLOWED_ORIGINS = [
  "https://app.tradeaihub.com",
  "https://tradeaihub.com",
  "https://www.tradeaihub.com",
];

// Allow localhost for development
if (process.env.NODE_ENV === "development") {
  ALLOWED_ORIGINS.push("http://localhost:3000");
  ALLOWED_ORIGINS.push("http://localhost:3001");
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400", // 24 hours
  "Access-Control-Allow-Credentials": "true",
};

/**
 * Check if origin is allowed and return appropriate CORS headers
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

  return {
    ...CORS_HEADERS,
    "Access-Control-Allow-Origin": allowedOrigin,
  };
}

/**
 * Handle CORS preflight requests (OPTIONS)
 */
export function handleCorsPrelight(origin: string | null) {
  const corsHeaders = getCorsHeaders(origin);
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
