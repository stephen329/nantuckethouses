import type { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "NantucketHouses.com | Real Estate Intelligence Hub",
  description:
    "Nantucket's premier real estate intelligence hub. Live market pulse, regulatory resources, building costs, and neighborhood expertise — interpreted through local judgment by Stephen Maury.",
  keywords:
    "Nantucket real estate, market data, HDC, zoning, building costs, luxury homes, Stephen Maury, Congdon Coleman",
  openGraph: {
    title: "NantucketHouses.com | Real Estate Intelligence Hub",
    description:
      "Live market pulse, regulatory insights, and neighborhood expertise for Nantucket real estate.",
    type: "website",
    siteName: "NantucketHouses.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "NantucketHouses.com",
    description:
      "Nantucket's premier real estate intelligence hub.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navigation />
        <main className="pt-16 lg:pt-20">{children}</main>
        <Footer />
        <Script
          src="https://static.klaviyo.com/onsite/js/WysYSe/klaviyo.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
