import type { CSSProperties } from "react";
import type { SiteBundle } from "@platform/db";
import { getDesign } from "@platform/db/theme";
import { getPage, getSpecials, type SiteCtx } from "@/lib/data";
import { telHref } from "@/lib/format";
import { localSiteHref } from "@/lib/url";

/** All offers come from this website's Specials collection. The first visible offer is featured. */
type Offer = Awaited<ReturnType<typeof getSpecials>>[number];

const money = /\$\s*(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?\+?/g;

function offerPrices(item: Offer) {
  // Keep supporting the discount strings already saved in the existing database.
  // Examples: "$149 (a $350+ value, save 60%)", "$119 (normally $149, save 20%)".
  const amounts = (item.discount ?? "").match(money) ?? [];
  const saving = item.discount?.match(/save\s+(\d+\s*%)/i)?.[1];
  return { now: amounts[0] || null, was: amounts[1] || null, saving: saving ?? null };
}

function offerContent(item: Offer) {
  const text = (item.description ?? "").trim();
  if (!text) return { intro: "", items: [] as string[], note: "" };
  const paragraphs = text.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
  // A short introductory paragraph can be followed by a one-per-line inclusion list.
  const intro = paragraphs.length > 1 ? paragraphs[0] : "";
  const remainder = paragraphs.length > 1 ? paragraphs.slice(1).join("\n") : text;
  // Existing records contain comma-separated prose; new Admin entries use one item per line.
  const hasNewlines = /\r?\n/.test(remainder);
  const source = hasNewlines ? remainder : remainder.replace(/\.\s*(?=No upsells?\b|No pressure\b|Conditions apply\b)/gi, ", ");
  const list = (hasNewlines ? source.split(/\r?\n/) : source.split(/,\s*(?![^()]*\))/))
    .map((part) => part.trim())
    .filter(Boolean);
  const noteParts: string[] = [];
  const included = list.filter((part) => {
    if (/^(?:and\s+)?no upsells?\b|^no pressure\b|^conditions apply\b/i.test(part)) {
      noteParts.push(part.replace(/^and\s+/i, ""));
      return false;
    }
    return true;
  }).map((part) => part.replace(/^(?:and\s+|[•\-*]\s*)/i, "").replace(/\.$/, ""));
  return { intro, items: included, note: noteParts.join(". ") };
}

function backgroundStyle(src?: string | null): CSSProperties | undefined {
  if (!src || !/^(https?:\/\/|\/)/i.test(src)) return undefined;
  // The overlay is separate so photographs retain their original appearance.
  return { backgroundImage: `url(${JSON.stringify(src)})` };
}

function OfferCard({ item, bundle, featured, fallbackImage }: { item: Offer; bundle: SiteBundle; featured?: boolean; fallbackImage?: string | null }) {
  const prices = offerPrices(item);
  const copy = offerContent(item);
  const phone = telHref(bundle.settings?.phone);
  const ctaHref = phone || localSiteHref(bundle.site.slug, "/make-an-appointment/");
  const image = item.imageUrl || fallbackImage;
  return (
    <article className={`micks-offer-card ${featured ? "micks-offer-featured" : "micks-offer-compact"}`} style={backgroundStyle(image)}>
      <div className="micks-offer-shade" aria-hidden="true" />
      <div className="micks-offer-content">
        <div className="micks-offer-heading">
          {prices.now ? (
            <p className="micks-offer-pricing">
              {prices.was && <span>{prices.was} {featured ? "VALUE." : "NORMALLY."} </span>}
              <span className="micks-offer-now">NOW {prices.now}.</span>
              {prices.saving && <span> SAVE {prices.saving}</span>}
            </p>
          ) : item.discount ? <p className="micks-offer-pricing">{item.discount}</p> : null}
          <h3>{item.title}</h3>
          {copy.intro && <p className="micks-offer-intro">{copy.intro}</p>}
        </div>
        {copy.items.length > 0 && (
          <div className="micks-offer-included">
            <h4>What&apos;s Included</h4>
            <ul>{copy.items.map((part, index) => <li key={`${item.id}-included-${index}`}>{part}</li>)}</ul>
          </div>
        )}
        {copy.note && <p className="micks-offer-note">{copy.note}</p>}
        <div className="micks-offer-actions">
          <a className="micks-offer-call" href={ctaHref}>{phone ? "Call Us" : "Book Now"}</a>
          {item.couponCode && <span className="micks-offer-code">CODE &ldquo;{item.couponCode}&rdquo;</span>}
        </div>
        {item.validUntil && <p className="micks-offer-expiry">Valid until {item.validUntil}</p>}
      </div>
    </article>
  );
}

export async function MicksSpecials({ bundle, ctx }: { bundle: SiteBundle; ctx: SiteCtx }) {
  const [offers, page] = await Promise.all([getSpecials(ctx), getPage(ctx, "specials")]);
  const section = page?.sections.find((s) => s.type === "specials");
  const sourceHeading = (section?.props as { heading?: string } | undefined)?.heading?.trim();
  // Treat legacy seeded copy as the template default, but respect a custom CMS heading.
  const heading = !sourceHeading || ["current specials", "this month's deals"].includes(sourceHeading.toLowerCase())
    ? "Featured Offers & Specials" : sourceHeading;
  const design = getDesign(bundle.theme ?? {});
  const fallbackImage = design.innerHeroImageUrl;
  const [featured, ...rest] = offers;
  return (
    <section className="micks-specials-page section">
      <div className="container-site">
        <h2>{heading}</h2>
        <p className="micks-specials-subtitle">Stay ahead of the road (and the weather) with these deals designed to keep your car in top shape.</p>
        {featured ? (
          <div className="micks-specials-offers">
            <OfferCard item={featured} bundle={bundle} featured fallbackImage={fallbackImage} />
            {rest.length > 0 && <div className="micks-offer-secondary-grid">{rest.map((offer) => <OfferCard key={offer.id} item={offer} bundle={bundle} fallbackImage={fallbackImage} />)}</div>}
          </div>
        ) : <p className="micks-specials-empty">There are no current offers. Please check back soon.</p>}
      </div>
    </section>
  );
}
