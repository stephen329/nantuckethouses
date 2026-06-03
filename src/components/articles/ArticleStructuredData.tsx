import type { ArticleMeta } from "@/lib/content";

type Props = {
  article: ArticleMeta;
  wordCount: number;
};

export function ArticleStructuredData({ article, wordCount }: Props) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    author: {
      "@type": "Person",
      name: article.author ?? "Stephen Maury",
    },
    datePublished: article.date,
    keywords: article.tags?.join(", ") ?? "",
    wordCount,
    timeRequired: `PT${article.readingTime}M`,
    publisher: {
      "@type": "Organization",
      name: "NantucketHouses.com",
      url: "https://nantuckethouses.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://nantuckethouses.com/articles/${article.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
