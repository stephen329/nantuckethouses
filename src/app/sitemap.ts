import type { MetadataRoute } from "next";
import { navPillars, standaloneNavItems } from "@/lib/navigation";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://nantuckethouses.com";
  const now = new Date().toISOString();

  // Home page — highest priority, changes frequently
  const pages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  // Pillar top-level pages
  for (const pillar of navPillars) {
    for (const item of pillar.items) {
      pages.push({
        url: `${baseUrl}${item.href}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  // Standalone pages
  for (const item of standaloneNavItems) {
    pages.push({
      url: `${baseUrl}${item.href}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return pages;
}
