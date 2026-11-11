import type { SiteBundle } from "@platform/db";
import { schemaHours } from "@/lib/format";

export function LocalBusinessJsonLd({ bundle, url }: { bundle: SiteBundle; url: string }) {
  const s = bundle.settings;
  if (!s) return null;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": s.businessType || "LocalBusiness",
    name: s.businessName,
    url,
    telephone: s.phone ?? undefined,
    email: s.email ?? undefined,
    image: bundle.theme?.logoUrl ?? undefined,
    address: s.address
      ? { "@type": "PostalAddress", streetAddress: s.address.street, addressLocality: s.address.city, addressRegion: s.address.region, postalCode: s.address.postalCode, addressCountry: s.address.country }
      : undefined,
    openingHoursSpecification: schemaHours(s.hours),
    areaServed: s.serviceArea ?? undefined,
    sameAs: Object.values(s.social ?? {}).filter(Boolean),
  };
  const loc = bundle.locations[0];
  if (loc?.lat && loc?.lng) data.geo = { "@type": "GeoCoordinates", latitude: Number(loc.lat), longitude: Number(loc.lng) };
  if (s.ratingValue && s.ratingCount) data.aggregateRating = { "@type": "AggregateRating", ratingValue: Number(s.ratingValue), reviewCount: s.ratingCount };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
