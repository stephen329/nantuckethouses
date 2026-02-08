import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Private Piece of the Faraway Island | Nantucket Houses",
  description:
    "Access Nantucket's most exclusive off-market opportunities. Curated listings, waterfront estates, historic town charm, and new construction—discreetly.",
  openGraph: {
    title: "Your Private Piece of the Faraway Island | Nantucket Houses",
    description:
      "Access Nantucket's most exclusive off-market opportunities. View curated listings.",
    type: "website",
  },
};

export default function BuyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
