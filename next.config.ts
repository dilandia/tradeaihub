import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/zella-score", destination: "/takerz-score", permanent: true },
      { source: "/ai-insights", destination: "/ai-hub", permanent: false },
      { source: "/ai-insights/:path*", destination: "/ai-hub/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
