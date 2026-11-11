import type { DesignOptions } from "@platform/db";

/** All public placements read certification artwork from this site's saved Branding settings. */
export type CertificationBadgeConfig = {
  slot: 1 | 2 | 3;
  src: string;
  alt: string;
  href?: string;
};

function toBadge(
  slot: 1 | 2 | 3,
  src: string | undefined,
  visible: boolean | undefined,
  href: string | undefined,
  alt: string | undefined,
  fallbackAlt: string,
): CertificationBadgeConfig | null {
  if (!src?.trim() || visible === false) return null;
  const link = href?.trim();
  const safeHref = link && (/^https?:\/\//i.test(link) || link.startsWith("/")) ? link : undefined;
  return { slot, src: src.trim(), alt: alt?.trim() || fallbackAlt, href: safeHref };
}

export function getActiveCertificationBadges(design: DesignOptions): CertificationBadgeConfig[] {
  const badges = [
    toBadge(1, design.serviceBadgeOneUrl, design.serviceBadgeOneVisible, design.serviceBadgeOneLink, design.serviceBadgeOneAlt, "Certified auto repair"),
    toBadge(2, design.serviceBadgeTwoUrl, design.serviceBadgeTwoVisible, design.serviceBadgeTwoLink, design.serviceBadgeTwoAlt, "ASE certified"),
    toBadge(3, design.serviceBadgeThreeUrl, design.serviceBadgeThreeVisible, design.serviceBadgeThreeLink, design.serviceBadgeThreeAlt, "Automotive certification"),
  ];
  return badges.filter((badge): badge is CertificationBadgeConfig => badge !== null);
}

function BadgeArtwork({ badge, className = "" }: { badge: CertificationBadgeConfig; className?: string }) {
  const image = <img src={badge.src} alt={badge.alt} className={`micks-cert-badge ${className}`.trim()} decoding="async" />;
  if (!badge.href) return image;
  const external = /^https?:\/\//i.test(badge.href);
  return <a className="micks-cert-badge-link" href={badge.href} title={badge.alt} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{image}</a>;
}

/** Shared row: hides empty/disabled slots, so there are never blank gaps. */
export function CertificationBadges({ design, className = "" }: { design: DesignOptions; className?: string }) {
  const badges = getActiveCertificationBadges(design);
  if (!badges.length) return null;
  return <div className={`micks-certification-group ${className}`.trim()} data-count={badges.length} aria-label="Certification badges">
    {badges.map((badge) => <BadgeArtwork key={badge.slot} badge={badge} />)}
  </div>;
}

/** Backwards-compatible single badge for any other template using a slot. */
export function CertificationBadge({ design, slot, className = "" }: { design: DesignOptions; slot: 1 | 2 | 3; className?: string }) {
  const badge = getActiveCertificationBadges(design).find((item) => item.slot === slot);
  return badge ? <BadgeArtwork badge={badge} className={className} /> : null;
}
