import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
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
