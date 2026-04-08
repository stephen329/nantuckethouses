import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/buy/"],
      },
    ],
    sitemap: "https://nantuckethouses.com/sitemap.xml",
  };
}
