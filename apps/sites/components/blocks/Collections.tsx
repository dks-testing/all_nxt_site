import Link from "next/link";
import { getServices, getSpecials, getTestimonials, getFaqs, getCaseStudies } from "@/lib/data";
import { telHref, formatAddress, groupHours } from "@/lib/format";
import { ArrowIcon, Stars, PhoneIcon, PinIcon, ClockIcon, WrenchIcon } from "../Icons";
import type { BlockComponentProps } from "./types";
import { localSiteHref } from "@/lib/url";
import { globalText } from "@/lib/global-content";

export async function ServicesGrid({ ctx, bundle, props }: BlockComponentProps<"services_grid">) {
  const all = await getServices(ctx);
  const items = props.limit ? all.slice(0, props.limit) : all;
  if (!items.length) return null;
  return (
    <section className="section">
      <div className="container-site">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold uppercase md:text-4xl">{props.heading}</h2>
          {props.subheading && <p className="mx-auto mt-3 max-w-2xl text-lg text-[var(--color-muted)]">{props.subheading}</p>}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((s) => (
            <Link key={s.id} href={localSiteHref(bundle.site.slug, `/${s.slug}/`)} className="group flex flex-col rounded-site border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-md">
              <WrenchIcon className="mb-4 h-8 w-8 text-[var(--color-primary)]" />
              <h3 className="mb-2 text-lg font-bold leading-snug">{s.name}</h3>
              <p className="mb-4 flex-1 text-sm text-[var(--color-muted)]">{globalText(s.summary, bundle)}</p>
              <span className="inline-flex items-center gap-1 text-sm font-bold uppercase text-[var(--color-primary)]">Learn more <ArrowIcon className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
        {props.limit && all.length > props.limit && (
          <div className="mt-10 text-center"><Link href={localSiteHref(bundle.site.slug, "/services/")} className="btn btn-dark">All services</Link></div>
        )}
      </div>
    </section>
  );
}

export async function Specials({ ctx, bundle, props }: BlockComponentProps<"specials">) {
  const items = await getSpecials(ctx);
  if (!items.length) return null;
  return (
    <section className="section bg-[var(--color-surface)]">
      <div className="container-site">
        <h2 className="mb-10 text-center text-3xl font-bold uppercase md:text-4xl">{props.heading}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((sp) => (
            <div key={sp.id} className="flex flex-col overflow-hidden rounded-site border-2 border-dashed border-[var(--color-primary)] bg-white">
              <div className="bg-[var(--color-primary)] px-6 py-4 text-[var(--color-primary-foreground)]">
                <h3 className="text-xl font-bold uppercase leading-tight">{sp.title}</h3>
                {sp.discount && <p className="mt-1 font-semibold">{sp.discount}</p>}
              </div>
              <div className="flex flex-1 flex-col p-6">
                {sp.description && <p className="flex-1 text-sm text-[var(--color-muted)]">{sp.description}</p>}
                {sp.couponCode && <p className="mt-4 text-sm">Code: <strong className="rounded bg-[var(--color-surface)] px-2 py-1 font-mono">{sp.couponCode}</strong></p>}
                {sp.validUntil && <p className="mt-2 text-xs text-[var(--color-muted)]">Valid until {sp.validUntil}</p>}
                <a href={telHref(bundle.settings?.phone) ?? localSiteHref(bundle.site.slug, "/make-an-appointment/")} className="btn btn-primary mt-5">Claim offer</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function Reviews({ ctx, bundle, props }: BlockComponentProps<"reviews">) {
  const storedItems = (await getTestimonials(ctx)).slice(0, props.limit);
  const s = bundle.settings;
  const googleUrl = s?.social?.google;
  const micks = props.variant === "micks-home";
  const items = micks && storedItems.length === 0 ? [
    { id: "micks-review-1", author: "Rachel Backes", rating: 5, body: globalText("What a hometown hero! Our check engine light went on Friday afternoon on our way to a gymnastics tournament. {{businessName}} helped us quickly and treated us like neighbors.", bundle), source: "google" as const, reviewDate: "6 months ago" },
    { id: "micks-review-2", author: "Concert on the Lake", rating: 5, body: globalText("Our van broke down on our way across southern Minnesota. A friend said to take it to {{businessName}}, and the team got us back on the road.", bundle), source: "google" as const, reviewDate: "7 months ago" },
    { id: "micks-review-3", author: "Leon S", rating: 1, body: "Mick seems nice enough and I can’t be too sure everyone else working here is complicit in the lies told by a Mr. Kelly.", source: "google" as const, reviewDate: "8 months ago" },
  ] : storedItems;
  if (!items.length && !s?.ratingValue) return null;
  if (micks) {
    return (
      <section className="micks-reviews section">
        <div className="container-site">
          <h2>{props.heading}</h2>
          <div className="micks-reviews-layout">
            <aside className="micks-review-summary">
              <strong>Mick&apos;s Repair</strong>
              {s?.ratingValue && <div><b>{s.ratingValue}</b> <Stars value={Number(s.ratingValue)} /></div>}
              {s?.ratingCount ? <p>Based on {s.ratingCount} reviews</p> : null}
              {googleUrl && <a href={googleUrl} target="_blank" rel="noopener noreferrer">review us on <b>G</b></a>}
            </aside>
            {items.length > 0 && <div className="micks-review-carousel">
              {items.slice(0, 3).map((t) => <figure key={t.id} className="micks-review-card">
                <figcaption><span className="micks-review-avatar">{t.author.charAt(0)}</span><strong>{t.author}</strong><b className="micks-google-mark">G</b></figcaption>
                {t.reviewDate && <small>{t.reviewDate}</small>}
                <Stars value={t.rating} />
                <blockquote>{t.body}</blockquote>
              </figure>)}
            </div>}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className={micks ? "micks-reviews section" : "section"}>
      <div className="container-site">
        <div className="mb-10 flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold uppercase md:text-4xl">{props.heading}</h2>
          {s?.ratingValue && (
            <div className="mt-4 flex items-center gap-3 text-lg">
              <span className="text-4xl font-bold">{s.ratingValue}</span>
              <div className="text-left">
                <Stars value={Number(s.ratingValue)} className="h-5 w-5" />
                {s.ratingCount ? <p className="text-sm text-[var(--color-muted)]">Based on {s.ratingCount} Google reviews</p> : null}
              </div>
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className={micks ? "micks-review-grid" : "grid gap-5 md:grid-cols-3"}>
            {items.map((t) => (
              <figure key={t.id} className={micks ? "micks-review-card" : "rounded-site bg-[var(--color-surface)] p-6"}>
                <Stars value={t.rating} />
                <blockquote className="mt-3 text-[var(--color-text)]">&ldquo;{t.body}&rdquo;</blockquote>
                <figcaption className="mt-4 text-sm font-bold">{t.author}{t.source === "google" && <span className="font-normal text-[var(--color-muted)]"> · Google</span>}</figcaption>
              </figure>
            ))}
          </div>
        )}
        {googleUrl && (
          <div className="mt-8 text-center">
            <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline text-[var(--color-primary)]">Read our reviews on Google</a>
          </div>
        )}
      </div>
    </section>
  );
}

export async function CaseStudies({ ctx, props }: BlockComponentProps<"case_studies">) {
  const items = await getCaseStudies(ctx);
  if (!items.length) return null;
  const micks = props.variant === "micks-home";
  return (
    <section className={micks ? "micks-cases section" : "section bg-[var(--color-secondary)] text-white"}>
      <div className="container-site">
        <h2 className="text-center text-3xl font-bold uppercase md:text-4xl">{props.heading}</h2>
        {props.subheading && <p className="micks-cases-intro">{props.subheading}</p>}
        <div className={micks ? "micks-case-grid" : "mt-10 grid gap-6 md:grid-cols-3"}>
          {items.map((c, index) => (
            <article key={c.id} className={micks ? "micks-case-card" : "rounded-site bg-white/5 p-6 ring-1 ring-white/10"}>
              {micks && <p className="micks-case-label">{props.labels[index] ?? "Repair result"}</p>}
              {micks && c.imageUrl && <div className="micks-case-image">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={c.imageUrl} alt="" /></div>}
              <div className={micks ? "micks-case-body" : ""}>
              <h3 className="mb-4 text-xl font-bold uppercase leading-tight text-[var(--color-accent)]">{c.title}</h3>
              {micks ? <p className="micks-case-summary">{[c.problem, c.diagnosis, c.fix].filter(Boolean).join(" ")}</p> : <dl className="space-y-3 text-sm text-white/85">
                <div><dt className="font-bold uppercase text-white">Problem</dt><dd>{c.problem}</dd></div>
                {c.diagnosis && <div><dt className="font-bold uppercase text-white">Diagnosis</dt><dd>{c.diagnosis}</dd></div>}
                {c.fix && <div><dt className="font-bold uppercase text-white">Fix</dt><dd>{c.fix}</dd></div>}
              </dl>}
              </div>
            </article>
          ))}
        </div>
        {props.closingText && <p className="micks-cases-closing">{props.closingText}</p>}
      </div>
    </section>
  );
}

export async function Faq({ ctx, props }: BlockComponentProps<"faq">) {
  const items = await getFaqs(ctx);
  if (!items.length) return null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
  return (
    <section className="section">
      <div className="container-site max-w-3xl">
        <h1 className="mb-8 text-center text-3xl font-bold uppercase md:text-4xl">{props.heading}</h1>
        <div className="divide-y divide-gray-200 rounded-site border border-gray-200">
          {items.map((f) => (
            <details key={f.id} className="group p-5">
              <summary className="flex items-center justify-between gap-4 text-lg font-semibold">
                {f.question}
                <span className="text-2xl text-[var(--color-primary)] transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[var(--color-muted)]">{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </section>
  );
}

export function ContactMap({ bundle, props }: BlockComponentProps<"contact_map">) {
  const s = bundle.settings;
  const addr = formatAddress(s?.address);
  const micks = props.variant === "micks-home";
  return (
    <section className={micks ? "micks-contact section" : "section bg-[var(--color-surface)]"} id="contact">
      <div className={micks ? "container-site micks-contact-grid" : "container-site grid gap-10 md:grid-cols-2"}>
        <div>
          <p className={micks ? "micks-section-kicker" : "hidden"}>Contact us</p>
          <h2 className="mb-6 text-3xl font-bold uppercase md:text-4xl">{props.heading}</h2>
          <ul className="space-y-5 text-lg">
            {s?.phone && <li className="flex gap-3"><PhoneIcon className="mt-1 h-5 w-5 text-[var(--color-primary)]" /><a href={telHref(s.phone)} className="font-semibold hover:text-[var(--color-primary)]">{s.phone}</a></li>}
            {addr && <li className="flex gap-3"><PinIcon className="mt-1 h-5 w-5 text-[var(--color-primary)]" /><span>{addr}</span></li>}
            {s?.hours && (
              <li className="flex gap-3"><ClockIcon className="mt-1 h-5 w-5 text-[var(--color-primary)]" />
                <ul>{groupHours(s.hours).map((h) => <li key={h.days}><span className="inline-block w-24 font-semibold">{h.days}</span>{h.time}</li>)}</ul>
              </li>
            )}
          </ul>
          {s?.serviceArea && <p className="mt-6 text-[var(--color-muted)]">Serving {s.serviceArea}.</p>}
          {addr && <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`} target="_blank" rel="noopener noreferrer" className="btn btn-dark mt-6">Get directions</a>}
        </div>
        {addr && (
          <iframe
            title={`Map to ${s?.businessName ?? "us"}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(addr)}&z=15&output=embed`}
            className="min-h-80 w-full rounded-site border-0 shadow"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>
    </section>
  );
}
