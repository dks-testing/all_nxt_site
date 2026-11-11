import Link from "next/link";
import { getHeroBanner } from "@/lib/data";
import { Stars, CheckIcon, PhoneIcon, PinIcon } from "../Icons";
import { getDesign } from "@platform/db/theme";
import type { BlockProps } from "@platform/db/blocks";
import type { BlockComponentProps } from "./types";
import { localSiteHref } from "@/lib/url";
import { telHref } from "@/lib/format";
import { MicksInnerHero } from "../MicksInnerHero";
import { CertificationBadges, getActiveCertificationBadges } from "../CertificationBadge";
import { globalCtaHref, globalText } from "@/lib/global-content";

type HeroExtra = { integratedTrust?: BlockProps<"trust_cards"> };

/** A template-selectable home hero. Content and assets still come from this tenant's CMS. */
export async function Hero({ ctx, bundle, props, index, pageSlug, integratedTrust }: BlockComponentProps<"hero"> & HeroExtra) {
  const banner = pageSlug === "" && index === 0 ? await getHeroBanner(ctx) : null;
  const heading = globalText(banner?.heading ?? props.heading, bundle);
  const sub = globalText(banner?.subheading ?? props.subheading, bundle);
  const image = banner?.imageUrl ?? props.imageUrl;
  const primarySource = banner?.ctaUrl ? { label: banner.ctaLabel ?? "Learn more", href: banner.ctaUrl } : props.primaryCta;
  const design = getDesign(bundle.theme ?? {});
  const sharedCertifications = getActiveCertificationBadges(design);
  const primary = primarySource ? { ...primarySource, href: globalCtaHref(design, primarySource.href, primarySource.label) } : undefined;
  const secondary = props.secondaryCta ? { ...props.secondaryCta, href: globalCtaHref(design, props.secondaryCta.href, props.secondaryCta.label) } : undefined;
  const tertiary = props.tertiaryCta ? { ...props.tertiaryCta, href: globalCtaHref(design, props.tertiaryCta.href, props.tertiaryCta.label) } : undefined;
  const micksHome = pageSlug === "" && index === 0 && (design.heroStyle === "micks-overlay" || (!design.heroStyle && design.headerStyle === "angled"));

  if (micksHome) {
    const s = bundle.settings;
    const city = s?.address?.city;
    const region = s?.address?.region;
    const street = s?.address?.street;
    const postal = s?.address?.postalCode;
    const location = [street, city, region, postal].filter(Boolean).join(", ").replace(/, ([^,]+), ([^,]+)$/, ", $1 $2");
    const third = tertiary;
    const cards = integratedTrust?.items ?? [];
    return (
      <section className="micks-home-hero" style={image ? { backgroundImage: `linear-gradient(rgba(0,0,0,.69),rgba(0,0,0,.73)),url(${JSON.stringify(image)})` } : undefined}>
        <div className="container-site micks-home-hero-inner">
          <div className="micks-home-top">
            <div className="micks-home-copy">
              {props.eyebrow && <p className="micks-home-eyebrow">{props.eyebrow}</p>}
              <h1 className="micks-home-title">{heading}</h1>
              {sub && <p className="micks-home-subtitle">{sub}</p>}
              <div className="micks-home-actions">
                {primary && <Link className="micks-hero-button" href={localSiteHref(bundle.site.slug, primary.href)}><span>{primary.label}</span></Link>}
                {secondary && <Link className="micks-hero-button" href={localSiteHref(bundle.site.slug, secondary.href)}><span>{secondary.label}</span></Link>}
                {third && <Link className="micks-hero-button" href={localSiteHref(bundle.site.slug, third.href)}><span>{third.label}</span></Link>}
              </div>
              {(location || s?.phone) && <div className="micks-contact-strips">
                {location && <div className="micks-contact-strip"><PinIcon className="inline-block h-4 w-4" /> {location}</div>}
                {s?.phone && <a href={telHref(s.phone)} className="micks-contact-strip"><PhoneIcon className="inline-block h-4 w-4" /> {s.phone}</a>}
              </div>}
            </div>
            {(props.showRating || props.reviewImageUrl || sharedCertifications.length > 0) && <aside className="micks-home-social-proof" aria-label="Ratings and certifications">
              {props.showRating && s?.ratingValue && <div className="micks-home-rating">
                <div><strong>{s.ratingValue}</strong> <Stars value={Number(s.ratingValue)} /></div>
                {s.ratingCount && <span>Based on {s.ratingCount} reviews</span>}
              </div>}
              {props.reviewImageUrl && <img src={props.reviewImageUrl} alt="Google reviews" className="micks-home-review-logo" />}
              <CertificationBadges design={design} className="micks-home-logos" />
            </aside>}
          </div>
          {cards.length > 0 && <div className="micks-home-trust-grid">
            {cards.map((item, i) => <article key={`${item.title}-${i}`} className="micks-home-trust-card">
              <h2>{item.title}</h2><div className="micks-home-card-rule" /><p>{item.body}</p>
            </article>)}
          </div>}
          {cards.length > 0 && <p className="micks-home-closing">{integratedTrust?.closingText || "We diagnose it clearly, explain it simply.\nWe treat every repair like we’re spending our own money."}</p>}
        </div>
      </section>
    );
  }

  if (pageSlug !== "" && design.headerStyle === "angled") {
    return <MicksInnerHero bundle={bundle} heading={heading} primaryCta={primary} imageUrl={image} />;
  }

  const s = bundle.settings;
  const big = Boolean(image);
  return (
    <section className={`relative overflow-hidden bg-[var(--color-secondary)] text-white ${big ? "py-24 md:py-32" : "py-16 md:py-20"}`}>
      {image && <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/30" />
      </>}
      <div className="container-site relative"><div className="max-w-3xl">
        {props.eyebrow && <p className="eyebrow mb-4 !text-[var(--color-accent)]">{props.eyebrow}</p>}
        <h1 className={`font-bold uppercase leading-[1.05] ${big ? "text-4xl md:text-6xl" : "text-3xl md:text-5xl"}`}>{heading}</h1>
        {sub && <p className="mt-5 max-w-2xl text-lg text-white/85 md:text-xl">{sub}</p>}
        {(primary || secondary || tertiary) && <div className="mt-8 flex flex-wrap gap-3">
          {primary && <Link href={localSiteHref(bundle.site.slug, primary.href)} className="btn btn-primary">{primary.label}</Link>}
          {secondary && <Link href={localSiteHref(bundle.site.slug, secondary.href)} className="btn btn-outline text-white">{secondary.label}</Link>}
          {tertiary && <Link href={localSiteHref(bundle.site.slug, tertiary.href)} className="btn btn-primary">{tertiary.label}</Link>}
        </div>}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          {props.showRating && s?.ratingValue && <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur"><Stars value={Number(s.ratingValue)} /><strong>{s.ratingValue}</strong>{s.ratingCount ? <span className="text-white/75">from {s.ratingCount} Google reviews</span> : null}</span>}
          {props.badges.map((b) => <span key={b} className="flex items-center gap-1.5 text-white/90"><CheckIcon className="h-4 w-4 text-[var(--color-accent)]" />{b}</span>)}
        </div>
      </div></div>
    </section>
  );
}
