import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nantucket Houses | Stephen Maury - Strategic Real Estate Advisory",
  description: "Led by Stephen Maury, Owner of Congdon & Coleman Real Estate (Est. 1931). Private advisory for buyers, sellers, and developers navigating Nantucket's most significant real estate decisions.",
  keywords: "Nantucket real estate, luxury homes, Stephen Maury, Congdon Coleman, development advisory, off-market properties",
  openGraph: {
    title: "Nantucket Houses | Stephen Maury",
    description: "Strategic real estate advisory. Private access to Nantucket's off-market opportunities.",
    type: "website",
    siteName: "Nantucket Houses",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nantucket Houses | Stephen Maury",
    description: "Strategic real estate advisory. Private access to Nantucket's off-market opportunities.",
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
        {children}
      </body>
    </html>
  );
}
