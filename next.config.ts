import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/zella-score", destination: "/takerz-score", permanent: true },
      { source: "/ai-insights", destination: "/ai-hub", permanent: false },
      { source: "/ai-insights/:path*", destination: "/ai-hub/:path*", permanent: false },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Suprimir logs do Sentry durante build
  silent: true,
  // Nao fazer upload de source maps (pode ser habilitado depois)
  sourcemaps: {
    disable: true,
  },
});
