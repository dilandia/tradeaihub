interface BlogArticleJsonLdProps {
  title: string
  description: string
  slug: string
  datePublished: string
  image: string
}

export function BlogArticleJsonLd({
  title,
  description,
  slug,
  datePublished,
  image,
}: BlogArticleJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    image: `https://tradeaihub.com${image}`,
    datePublished,
    dateModified: datePublished,
    author: {
      "@type": "Organization",
      name: "Trade AI Hub",
      url: "https://tradeaihub.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Trade AI Hub",
      url: "https://tradeaihub.com",
      logo: {
        "@type": "ImageObject",
        url: "https://tradeaihub.com/icon-glyph-512x512.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://tradeaihub.com/blog/${slug}`,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
