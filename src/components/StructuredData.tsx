/**
 * JSON-LD structured data for SEO.
 * Renders Organization, WebSite, and RealEstateAgent schemas.
 */
export function StructuredData() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "NantucketHouses.com",
    alternateName: "Congdon & Coleman Real Estate",
    url: "https://nantuckethouses.com",
    logo: "https://nantuckethouses.com/Nantucket%20Houses_Master_logo.png",
    description:
      "Nantucket's premier real estate intelligence hub. Market data, regulatory insights, and neighborhood expertise.",
    founder: {
      "@type": "Person",
      name: "Stephen Maury",
      jobTitle: "Licensed Real Estate Broker",
      url: "https://nantuckethouses.com/about",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Nantucket",
      addressRegion: "MA",
      postalCode: "02554",
      addressCountry: "US",
    },
    telephone: "+1-508-451-0191",
    email: "stephen@nantuckethouses.com",
    areaServed: {
      "@type": "City",
      name: "Nantucket",
      containedInPlace: {
        "@type": "State",
        name: "Massachusetts",
      },
    },
    sameAs: [
      "https://www.instagram.com/nantuckethouses",
      "https://www.linkedin.com/in/stephenmaury",
    ],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "NantucketHouses.com",
    url: "https://nantuckethouses.com",
    description:
      "Nantucket real estate intelligence hub — market pulse, regulatory resources, building costs, and neighborhood expertise.",
    publisher: {
      "@type": "Organization",
      name: "Congdon & Coleman Real Estate",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
