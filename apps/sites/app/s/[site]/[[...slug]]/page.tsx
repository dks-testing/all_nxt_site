import type { Metadata } from "next";
import { parseBlock } from "@platform/db/blocks";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBundle, getPage, getPageDraft, getService, getServices, parseSiteParam, type SiteCtx } from "@/lib/data";
import { RenderSections } from "@/components/RenderSections";
import { RichText, telHref } from "@/lib/format";
import { CheckIcon, PhoneIcon } from "@/components/Icons";
import { localSiteHref } from "@/lib/url";
import { getDesign } from "@platform/db/theme";
import { MicksInnerHero } from "@/components/MicksInnerHero";
import { MicksContentPage } from "@/components/MicksContentPages";
import { MicksSpecials } from "@/components/MicksSpecials";
import { CertificationBadges } from "@/components/CertificationBadge";
import { QuoteMark } from "@/components/QuoteMark";
import { StepListIcon } from "@/components/TrustListIcon";
import { globalCta, globalCtaHref, globalText } from "@/lib/global-content";

type Props = { params: Promise<{ site: string; slug?: string[] }>; searchParams?: Promise<Record<string, string | string[] | undefined>> };

// Pages are rendered on first request, then cached until the site's tag is revalidated (ISR).
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

async function load(ctx: SiteCtx, slugParts?: string[]) {
  const slug = (slugParts ?? []).map(decodeURIComponent).join("/");
  const page = ctx.preview ? await getPageDraft(ctx, slug) : await getPage(ctx, slug);
  if (page) return { kind: "page" as const, slug, ...page };
  // Service detail pages live at the root (e.g. /engine-repair/) to keep the old WordPress URLs.
  if (slugParts?.length === 1) {
    const service = await getService(ctx, slug);
    if (service) return { kind: "service" as const, slug, service };
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { site, slug } = await params;
  const ctx = parseSiteParam(site);
  const r = await load(ctx, slug);
  if (!r) return {};
  const b = await getBundle(ctx);
  const path = localSiteHref(b.site.slug, r.slug ? `/${r.slug}/` : "/");
  if (r.kind === "service") {
    const title = globalText(r.service.seoTitle ?? r.service.name, b);
    const description = globalText(r.service.seoDescription ?? r.service.summary, b) || undefined;
    return { title: { absolute: title }, description, keywords: r.service.seoKeywords?.split(",").map((word) => word.trim()).filter(Boolean), alternates: { canonical: path }, openGraph: { title, description, url: path, type: "website", images: r.service.imageUrl ? [r.service.imageUrl] : undefined }, twitter: { card: "summary_large_image", title, description, images: r.service.imageUrl ? [r.service.imageUrl] : undefined } };
  }
  const title = globalText(r.page.seoTitle ?? r.page.title, b);
  const description = globalText(r.page.seoDescription, b) || undefined;
  const image = r.page.ogImage ?? b.theme?.logoUrl ?? undefined;
  return {
    title: r.page.seoTitle ? { absolute: title } : title,
    description,
    keywords: r.page.seoKeywords?.split(",").map((word) => word.trim()).filter(Boolean),
    alternates: { canonical: process.env.NODE_ENV === "development" ? path : (r.page.canonicalUrl || path) },
    robots: { index: ctx.preview ? false : !r.page.noIndex, follow: ctx.preview ? false : !r.page.noFollow },
    openGraph: { title, description, url: path, type: "website", images: image ? [image] : undefined },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { site, slug } = await params;
  const ctx = parseSiteParam(site);
  const bundle = await getBundle(ctx);
  const r = await load(ctx, slug);
  if (!r) notFound();

  if (r.kind === "page") {
    const design = getDesign(bundle.theme ?? {});
    const query = searchParams ? await searchParams : {};
    const sectionPreview = ctx.preview && typeof query.sectionPreview === "string" ? query.sectionPreview : "";
    const rawSectionProps = ctx.preview && typeof query.sectionProps === "string" && query.sectionProps.length < 50000 ? query.sectionProps : "";
    let sections = r.sections;
    if (/^[a-f0-9-]{36}$/i.test(sectionPreview) && rawSectionProps) {
      try {
        const props = JSON.parse(rawSectionProps);
        if (props && typeof props === "object" && !Array.isArray(props)) sections = sections.map((section) => section.id === sectionPreview ? { ...section, props } : section);
      } catch {}
    }
    if (sectionPreview && query.sectionOnly === "1") {
      const selectedSection = sections.find((section) => section.id === sectionPreview);
      if (design.headerStyle === "angled" && r.slug === "specials" && selectedSection?.type === "specials") {
        const props = parseBlock("specials", selectedSection.props);
        if (props) {
          return <div className="cms-section-preview"><style>{`body:has(.cms-section-preview)>header,body:has(.cms-section-preview)>footer,body:has(.cms-section-preview)>.sticky{display:none!important}body:has(.cms-section-preview){background:var(--color-background);overflow-x:hidden}.cms-section-preview{min-height:100vh}`}</style><MicksSpecials ctx={ctx} bundle={bundle} props={props} /></div>;
        }
      }
      if (design.headerStyle === "angled" && r.slug === "about-us" && selectedSection && new Set(["about", "about_intro", "about_mission", "about_work", "about_owner", "team_gallery", "about_cta"]).has(selectedSection.type)) {
        return <div className="cms-section-preview"><style>{`body:has(.cms-section-preview)>header,body:has(.cms-section-preview)>footer,body:has(.cms-section-preview)>.sticky{display:none!important}body:has(.cms-section-preview){background:var(--color-background);overflow-x:hidden}.cms-section-preview{min-height:100vh}`}</style><MicksContentPage pageSlug={r.slug} bundle={bundle} ctx={ctx} sections={sections.filter((section) => section.id === sectionPreview)} /></div>;
      }
      return <div className="cms-section-preview"><style>{`body:has(.cms-section-preview)>header,body:has(.cms-section-preview)>footer,body:has(.cms-section-preview)>.sticky{display:none!important}body:has(.cms-section-preview){background:var(--color-background);overflow-x:hidden}.cms-section-preview{min-height:100vh}`}</style><RenderSections sections={sections.filter((section) => section.id === sectionPreview)} ctx={ctx} bundle={bundle} pageSlug={r.slug} /></div>;
    }
    // Diagnostics and Tires are composed from normal CMS sections so their
    // content, visibility, and ordering stay editable. Remaining replicas are
    // migrated separately.
    const micksPages = ["about-us", "services", "specials", "testimonials", "make-an-appointment"];
    if (design.headerStyle === "angled" && micksPages.includes(r.slug)) {
      // Keep the reference-design page template, but render any additional CMS
      // sections instead of silently dropping them on these legacy routes.
      const templateSections: Record<string, ReadonlySet<string>> = {
        // The live About page ends with its crew/diagnostics content. Its old
        // CMS reviews and CTA blocks must not be appended after that template.
        "about-us": new Set(["hero", "about", "about_intro", "about_mission", "about_work", "about_owner", "team_gallery", "about_cta", "reviews", "cta"]),
        // The services template ends with the service cards; omit its legacy CTA banner.
        services: new Set(["hero", "services_grid", "cta"]),
        // The specials page ends with its offers; omit the legacy booking form.
        specials: new Set(["hero", "specials", "booking_form"]),
        testimonials: new Set(["hero", "reviews"]),
        "make-an-appointment": new Set(["hero", "booking_form", "contact_map"]),
      };
      const extraSections = sections.filter((section) => !templateSections[r.slug]?.has(section.type));
      return <>
        <MicksContentPage pageSlug={r.slug} bundle={bundle} ctx={ctx} sections={sections} />
        {extraSections.length > 0 && <RenderSections sections={extraSections} ctx={ctx} bundle={bundle} pageSlug={r.slug} />}
      </>;
    }
    return <RenderSections sections={sections} ctx={ctx} bundle={bundle} pageSlug={r.slug} />;
  }

  const svc = r.service;
  const others = (await getServices(ctx)).filter((x) => x.id !== svc.id).slice(0, 6);
  const phone = bundle.settings?.phone;
  const design = getDesign(bundle.theme ?? {});
  const scheduleAction = globalCta(design, "/make-an-appointment/#book", "Schedule Service");
  const callAction = globalCta(design, design.callCtaHref || telHref(bundle.settings?.phone), "Call Now");
  if (design.headerStyle === "angled") {
    const serviceImage = svc.imageUrl || design.serviceDefaultImageUrl;
    const blocks = globalText(svc.body, bundle).replace(/\r/g, "").split(/\n{2,}/).filter(Boolean);
    const markedHeading = blocks[0]?.match(/^#\s+(.+)/);
    const leadHeading = markedHeading?.[1] ?? svc.name;
    const contentBlocks = markedHeading ? blocks.slice(1) : blocks;
    const sectionHeadingIndex = contentBlocks.findIndex((block) => /^##\s+/.test(block));
    const introBlocks = sectionHeadingIndex >= 0 ? contentBlocks.slice(0, sectionHeadingIndex) : contentBlocks;
    const bulletHeading = sectionHeadingIndex >= 0 ? contentBlocks[sectionHeadingIndex].replace(/^##\s+/, "") : "What we can help with";
    const serviceBullets = svc.bullets ?? [];
    const closingBlocks = sectionHeadingIndex >= 0 ? contentBlocks.slice(sectionHeadingIndex + 1) : [];
    const processImage = design.serviceProcessImageUrl || "https://www.micksrepair.com/wp-content/uploads/2026/03/micks-repair-worthington-mn-sign.jpeg";
    const trustImage = design.serviceTrustImageUrl || "https://www.micksrepair.com/wp-content/uploads/2026/04/555799130_25292959790311872_8516031389215206101_n.jpg";
    const vehicleImage = design.serviceVehicleImageUrl || "https://www.micksrepair.com/wp-content/uploads/2026/04/blue-car.webp";
    const pairs = (items?: string[] | null) => (items ?? []).map((item) => {
      const [title, ...body] = item.split("|");
      return [title.trim(), body.join("|").trim()] as [string, string];
    }).filter(([title, body]) => title && body);
    const process = { heading: globalText(svc.processHeading || `Our 4-Step ${svc.name} Service`, bundle), steps: pairs(svc.processSteps) };
    const trustItems = pairs(svc.trustItems);
    const finalAction = globalCta(design, svc.finalCtaHref || "/diagnostics/", svc.finalCtaLabel || "Start Diagnostics");
    return (
      <>
        <MicksInnerHero bundle={bundle} heading={svc.name} variant="service" />
        <section className="micks-service-intro">
          <div className="container-site micks-service-intro-grid">
            <div className="micks-service-photo-wrap">
              {serviceImage ? <img src={serviceImage} alt={`${svc.name} at ${bundle.settings?.businessName ?? bundle.site.name}`} className="micks-service-photo" /> : <div className="micks-service-photo-placeholder" />}
            </div>
            <div className="micks-service-copy">
              <div className="micks-service-heading"><QuoteMark design={design} className="micks-quote-mark" /><h2>{leadHeading}</h2></div>
              {introBlocks.map((block, i) => <RichText key={i} text={block} className="micks-service-prose" />)}
              {serviceBullets.length > 0 && <>
                <h3>{bulletHeading}</h3>
                <ul className="micks-service-bullets">{serviceBullets.map((b) => <li key={b}><CheckIcon className="h-4 w-4" />{b}</li>)}</ul>
              </>}
              {closingBlocks.map((block, i) => <RichText key={i} text={block} className="micks-service-prose" />)}
              <div className="micks-service-bottom-actions">
                <Link href={localSiteHref(bundle.site.slug, scheduleAction.href)} className="micks-hero-button"><span>{scheduleAction.label}</span></Link>
                <CertificationBadges design={design} className="micks-service-badges" />
              </div>
            </div>
          </div>
        </section>
        <section className="micks-service-process"><div className="container-site micks-service-live-grid"><img src={processImage} alt={`${bundle.settings?.businessName ?? bundle.site.name} storefront`} /><div><h2>{process.heading}</h2><div className="micks-service-step-list">{process.steps.map(([title, body]) => <div key={title}><StepListIcon design={design} label={title} /><p><strong>{title}</strong>{body}</p></div>)}</div></div></div></section>
        {svc.showVehicleCallout && <section className="micks-service-vehicle-callout"><div className="container-site"><div><h2>{globalText(svc.vehicleCalloutHeading, bundle)}</h2><p>{globalText(svc.vehicleCalloutBody, bundle)}</p><div className="service-btns"><a href={callAction.href}><span>{callAction.label}</span></a><Link href={localSiteHref(bundle.site.slug, scheduleAction.href)}><span>{scheduleAction.label}</span></Link></div></div><img src={vehicleImage} alt="Vehicle" /></div></section>}
        <section className="micks-service-live-trust"><div className="container-site micks-service-live-grid"><div><h2>{globalText(svc.trustHeading, bundle)}</h2><div className="micks-service-step-list micks-service-trust-list">{trustItems.map(([title, body]) => <div key={title}><StepListIcon design={design} label={title} /><p><strong>{globalText(title, bundle)}</strong>{globalText(body, bundle)}</p></div>)}</div></div><img src={trustImage} alt={`${bundle.settings?.businessName ?? bundle.site.name} in the community`} /></div></section>
        <section className="micks-know-cta section"><div><h2>{globalText(svc.finalHeading, bundle)}</h2><p>{globalText(svc.finalBody, bundle)}</p><Link href={localSiteHref(bundle.site.slug, finalAction.href)}><span>{finalAction.label}</span></Link></div></section>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Service", name: svc.name, description: svc.summary, provider: { "@type": bundle.settings?.businessType ?? "LocalBusiness", name: bundle.settings?.businessName } }).replace(/</g, "\\u003c") }} />
      </>
    );
  }
  return (
    <>
      <section className="bg-[var(--color-secondary)] py-16 text-white md:py-20">
        <div className="container-site">
          <nav className="mb-4 text-sm text-white/70"><Link href={localSiteHref(bundle.site.slug, "/services/")} className="hover:text-white">Services</Link> / {svc.name}</nav>
          <h1 className="max-w-3xl text-4xl font-bold uppercase md:text-5xl">{svc.name}</h1>
            {svc.summary && <p className="mt-4 max-w-2xl text-lg text-white/85">{globalText(svc.summary, bundle)}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={localSiteHref(bundle.site.slug, scheduleAction.href)} className="btn btn-primary"><span>{scheduleAction.label}</span></Link>
            {phone && <a href={telHref(phone)} className="btn btn-outline text-white"><PhoneIcon className="h-4 w-4" /><span>{phone}</span></a>}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container-site grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {svc.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={svc.imageUrl} alt={svc.name} className="mb-8 aspect-video w-full rounded-site object-cover" />
            )}
            <RichText text={globalText(svc.body, bundle)} className="prose-site text-lg text-[var(--color-muted)]" />
            {!!svc.bullets?.length && (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {svc.bullets.map((b) => <li key={b} className="flex gap-2 font-semibold"><CheckIcon className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />{b}</li>)}
              </ul>
            )}
            {svc.priceFrom && <p className="mt-6 text-lg">Starting at <strong>{svc.priceFrom}</strong></p>}
          </div>
          <aside className="h-fit rounded-site bg-[var(--color-surface)] p-6">
            <h2 className="mb-4 text-lg font-bold uppercase">Other services</h2>
            <ul className="space-y-2">
              {others.map((o) => <li key={o.id}><Link href={localSiteHref(bundle.site.slug, `/${o.slug}/`)} className="font-semibold hover:text-[var(--color-primary)]">{o.name}</Link></li>)}
            </ul>
            <Link href={localSiteHref(bundle.site.slug, "/services/")} className="mt-5 inline-block text-sm font-bold uppercase text-[var(--color-primary)]">All services →</Link>
          </aside>
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Service", name: svc.name, description: svc.summary, provider: { "@type": bundle.settings?.businessType ?? "LocalBusiness", name: bundle.settings?.businessName } }).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
