import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://tradeaihub.com"

  return [
    {
      url: baseUrl,
      lastModified: new Date("2026-02-26"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date("2026-02-15"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date("2026-02-15"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/affiliates`,
      lastModified: new Date("2026-02-26"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date("2026-02-15"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date("2026-02-15"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date("2026-02-26"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/5-metrics-every-forex-trader-should-track`,
      lastModified: new Date("2026-02-20"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/how-ai-is-changing-trading-journaling`,
      lastModified: new Date("2026-02-18"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/from-losing-to-winning-data-driven-approach`,
      lastModified: new Date("2026-02-15"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/the-psychology-of-successful-trading`,
      lastModified: new Date("2026-02-25"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/position-sizing-explained`,
      lastModified: new Date("2026-02-25"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ]
}
