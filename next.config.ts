import type { NextConfig } from "next";
import { execSync } from "child_process";
import { withSentryConfig } from "@sentry/nextjs";

function getDeploymentId(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return Date.now().toString();
  }
}

const nextConfig: NextConfig = {
  // Version skew protection: forces hard reload when browser has stale JS
  deploymentId: getDeploymentId(),
  // Lint is now handled by standalone ESLint CLI (npm run lint)
  // Disable built-in next build lint step to avoid duplicate checks
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
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
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.posthog.com https://us.i.posthog.com https://*.sentry.io https://browser.sentry-cdn.com https://cdn.lordicon.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.posthog.com https://us.i.posthog.com https://*.sentry.io https://api.stripe.com https://metaapi.cloud https://*.metaapi.cloud",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "worker-src 'self' blob:",
              "media-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
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
