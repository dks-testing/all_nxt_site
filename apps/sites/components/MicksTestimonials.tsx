import type { SiteBundle } from "@platform/db";
import type { BlockProps } from "@platform/db/blocks";
import { getTestimonials, type SiteCtx } from "@/lib/data";
import { globalText } from "@/lib/global-content";
import { Stars } from "./Icons";

function reviewUrl(value?: string | null) {
  return value && /^https?:\/\//i.test(value.trim()) ? value.trim() : undefined;
}

function GoogleMark() {
  return <svg className="micks-testimonial-google" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285f4" d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.43h11a9.4 9.4 0 0 1-4.08 6.18v5.14h6.61c3.87-3.56 6.08-8.81 6.08-14.83Z"/><path fill="#34a853" d="M24 44c5.51 0 10.13-1.83 13.51-4.96l-6.61-5.14c-1.83 1.23-4.17 1.97-6.9 1.97-5.32 0-9.84-3.59-11.46-8.43H5.7v5.3A20.4 20.4 0 0 0 24 44Z"/><path fill="#fbbc05" d="M12.54 27.44a12.3 12.3 0 0 1 0-7.88v-5.3H5.7a20 20 0 0 0 0 18.48l6.84-5.3Z"/><path fill="#ea4335" d="M24 11.13c3.01 0 5.69 1.03 7.82 3.05l5.86-5.86A19.64 19.64 0 0 0 24 3a20.4 20.4 0 0 0-18.3 11.26l6.84 5.3c1.62-4.84 6.14-8.43 11.46-8.43Z"/></svg>;
}

function ReviewBadge({ platform, href }: { platform: "facebook" | "google"; href?: string }) {
  const className = `micks-testimonial-review-badge micks-testimonial-${platform === "facebook" ? "facebook" : "google-link"}`;
  const content = <><Stars /><span className="micks-testimonial-review-label">Review Us On</span><strong>{platform === "facebook" ? "facebook" : "Google+"}</strong></>;
  return href
    ? <a className={className} href={href} target="_blank" rel="noopener noreferrer">{content}<span className="sr-only">(opens in a new tab)</span></a>
    : <span className={className} role="link" aria-disabled="true">{content}</span>;
}

export async function MicksTestimonials({ bundle, ctx, props }: { bundle: SiteBundle; ctx: SiteCtx; props?: BlockProps<"reviews"> }) {
  const items = (await getTestimonials(ctx)).slice(0, props?.limit ?? 30);
  const settings = bundle.settings;
  const businessName = settings?.businessName || bundle.site.name;
  const sourceHeading = props?.heading?.trim();
  const heading = sourceHeading && !["reviews", "what our customers say"].includes(sourceHeading.toLowerCase())
    ? globalText(sourceHeading, bundle) : `What Our Customers Are Saying About ${businessName}`;
  const headingLines = heading.match(/^(what our customers are saying about)\s+(.+)$/i);
  const googleUrl = reviewUrl(props?.googleReviewUrl);
  const facebookUrl = reviewUrl(props?.facebookReviewUrl);
  return <>
    <section className="micks-testimonials-page section">
      <div className="container-site">
        <h2>{headingLines ? <>{headingLines[1]}<span>{headingLines[2]}</span></> : heading}</h2>
        <div className="micks-testimonial-summary">
          <div className="micks-testimonial-business">
            <svg className="micks-testimonial-store" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 13v15h22V13M3 13l3-9h20l3 9M3 13c0 5 7 5 7 0 0 5 6 5 6 0 0 5 6 5 6 0 0 5 7 5 7 0M11 4l-1 9M21 4l1 9M16 4v9" /></svg>
            <div><strong>{businessName}</strong>{settings?.ratingValue && <span><b>{settings.ratingValue}</b><Stars value={Number(settings.ratingValue)} /></span>}{settings?.ratingCount && <small>Based on {settings.ratingCount} reviews</small>}</div>
          </div>
          {googleUrl && <a href={googleUrl} target="_blank" rel="noopener noreferrer">review us on <GoogleMark /><span className="sr-only">Google (opens in a new tab)</span></a>}
        </div>
        <div className="micks-testimonial-grid">
          {items.map((item) => <article key={item.id}>
            <div className="micks-testimonial-author"><span className="micks-testimonial-initial" aria-hidden="true">{item.author.charAt(0)}</span><div><strong title={item.author}>{item.author}</strong>{item.reviewDate && <small>{item.reviewDate}</small>}</div>{item.source === "google" && <GoogleMark />}</div>
            <Stars value={item.rating} />
            {item.body && <p tabIndex={0} aria-label={`Review by ${item.author}`}>{globalText(item.body, bundle)}</p>}
          </article>)}
        </div>
        {!items.length && <p className="micks-testimonial-empty">There are no reviews yet. Share your experience with us.</p>}
      </div>
    </section>
    <section className="micks-testimonial-review-links" aria-label="Leave a review"><div className="container-site">
      <ReviewBadge platform="facebook" href={facebookUrl} />
      <ReviewBadge platform="google" href={googleUrl} />
    </div></section>
  </>;
}
