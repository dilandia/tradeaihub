import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/contact", "/blog", "/privacy", "/terms"],
        disallow: [
          "/dashboard",
          "/trades",
          "/reports",
          "/settings",
          "/import",
          "/takerz-score",
          "/strategies",
          "/economic-events",
          "/ai-hub",
          "/api/",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: "https://tradeaihub.com/sitemap.xml",
  }
}
