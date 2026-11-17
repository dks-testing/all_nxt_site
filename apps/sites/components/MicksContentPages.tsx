import Link from "next/link";
import type { SiteBundle } from "@platform/db";
import { buildSlots } from "@platform/db/booking";
import { getDesign } from "@platform/db/theme";
import { getServices, type SiteCtx } from "@/lib/data";
import { formatAddress, groupHours, telHref } from "@/lib/format";
import { localSiteHref } from "@/lib/url";
import { Stars } from "./Icons";
import { MicksInnerHero } from "./MicksInnerHero";
import { BookingFormClient } from "./BookingFormClient";
import { CertificationBadges } from "./CertificationBadge";
import { QuoteMark } from "./QuoteMark";
import { globalText, sharedToolConfig } from "@/lib/global-content";
import { StepListIcon } from "./TrustListIcon";
import { MicksSpecials } from "./MicksSpecials";
import { MicksTestimonials } from "./MicksTestimonials";
import type { BlockProps } from "@platform/db/blocks";
import { parseBlock } from "@platform/db/blocks";

const WP = "https://www.micksrepair.com/wp-content/uploads";

type PageSection = { type: string; props: Record<string, unknown> };

function LineBreakText({ text }: { text: string }) {
  return <>{text.split("\n").map((line, index) => <span key={`${line}-${index}`}>{index > 0 && <br />}{line}</span>)}</>;
}

export async function MicksContentPage({ pageSlug, bundle, ctx, sections }: { pageSlug: string; bundle: SiteBundle; ctx: SiteCtx; sections: PageSection[] }) {
  const headings: Record<string, string> = {
    "about-us": "About Us",
    diagnostics: "Diagnostics",
    tires: "Tires",
    specials: "Specials",
    testimonials: "Testimonials",
    "make-an-appointment": "Make an Appointment",
    services: "Yea, We Can Fix That",
  };
  const section = (type: string) => sections.find((item) => item.type === type)?.props;
  const heroProps = parseBlock("hero", section("hero") ?? {});
  const aboutProps = parseBlock("about", section("about") ?? {});
  const servicesProps = parseBlock("services_grid", section("services_grid") ?? {});
  const specialsProps = parseBlock("specials", section("specials") ?? {});
  const reviewsProps = parseBlock("reviews", section("reviews") ?? {});
  const bookingProps = parseBlock("booking_form", section("booking_form") ?? {});
  const heroHeading = heroProps?.heading || (pageSlug === "make-an-appointment" ? bookingProps?.heading : undefined) || headings[pageSlug] || pageSlug;
  return <>
    {(heroProps || pageSlug === "make-an-appointment") && <MicksInnerHero bundle={bundle} heading={heroHeading} imageUrl={heroProps?.imageUrl} variant={pageSlug === "services" ? "service" : "page"} />}
    {pageSlug === "services" && servicesProps && <MicksServices bundle={bundle} ctx={ctx} props={servicesProps} />}
    {pageSlug === "about-us" && aboutProps && <MicksAbout bundle={bundle} props={aboutProps} />}
    {pageSlug === "diagnostics" && <MicksSmartTool bundle={bundle} kind="diagnostics" />}
    {pageSlug === "tires" && <MicksSmartTool bundle={bundle} kind="tires" />}
    {pageSlug === "specials" && specialsProps && <MicksSpecials bundle={bundle} ctx={ctx} props={specialsProps} />}
    {pageSlug === "testimonials" && reviewsProps && <MicksTestimonials bundle={bundle} ctx={ctx} props={reviewsProps} />}
    {pageSlug === "make-an-appointment" && bookingProps && <MicksAppointment bundle={bundle} props={bookingProps} />}
  </>;
}

async function MicksServices({ bundle, ctx, props }: { bundle: SiteBundle; ctx: SiteCtx; props: BlockProps<"services_grid"> }) {
  const services = await getServices(ctx);
  const visibleServices = props.limit ? services.slice(0, props.limit) : services;
  return <section className="micks-services-index section"><div className="container-site">
    <h2><LineBreakText text={globalText(props.heading, bundle)} /></h2>
    {props.subheading && <p className="micks-services-intro">{globalText(props.subheading, bundle)}</p>}
    <div className="micks-services-grid">{visibleServices.map((service) => {
      const image = service.imageUrl;
      return <article key={service.id} style={{ backgroundImage: `linear-gradient(180deg,#0002 10%,#000e 100%),url(${JSON.stringify(image)})` }}>
        <h3>{service.name}</h3>
        {service.summary && <p>{globalText(service.summary, bundle)}</p>}
        <Link href={localSiteHref(bundle.site.slug, `/${service.slug}/`)} style={{ transform: "skewX(var(--button-skew))" }}>
          <span style={{ transform: "skewX(var(--button-text-skew))" }}>{props.ctaLabel}</span>
        </Link>
      </article>;
    })}</div>
  </div></section>;
}

function MicksAbout({ bundle, props }: { bundle: SiteBundle; props: BlockProps<"about"> }) {
  const design = getDesign(bundle.theme ?? {});
  const settings = bundle.settings;
  const name = settings?.businessName ?? bundle.site.name;
  const address = formatAddress(settings?.address);
  const owner = props.imageUrl || design.aboutOwnerImageUrl;
  const team = design.aboutTeamImageUrl;
  const car = design.aboutVehicleImageUrl;
  const crew = props.crew.map((member, index) => ({ name: member.title, description: member.body, imageUrl: props.crewImageUrls[index] }));
  const workItems = design.aboutWorkItems ?? [];
  const ownerParagraphs = globalText(props.ownerBody, bundle).split(/\n{2,}/).filter(Boolean);
  const [ownerLabel, ...ownerIntroParts] = (ownerParagraphs[0] ?? "").split("\n");
  const ownerIntro = ownerIntroParts.join("\n");
  return <>
    <section className="micks-about-page-intro section"><div className="container-site micks-about-page-grid">
      <img src={owner} alt={`Mick Eggers at ${name}`} />
      <div><div className="micks-live-title"><QuoteMark design={design} className="micks-about-quote" /><h2>{props.eyebrow}</h2></div><h3><LineBreakText text={globalText(props.heading, bundle)} /></h3>
        {globalText(props.body, bundle).split(/\n{2,}/).filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <CertificationBadges design={design} className="micks-about-badges" />
      </div>
    </div></section>
    <section className="micks-mission section"><div className="container-site micks-mission-grid"><div><h2>{props.missionHeading}</h2><h3><LineBreakText text={props.missionBody || ""} /></h3><div className="micks-mission-table"><b>Location</b><b>Phone</b><b>Hours</b><span>{address}</span><a href={telHref(settings?.phone)}>{settings?.phone}</a><span>{groupHours(settings?.hours)[0]?.days}: {groupHours(settings?.hours)[0]?.time}</span></div><div className="micks-live-buttons">{settings?.phone && <a href={telHref(settings.phone)}><span>Call Now</span></a>}<Link href={localSiteHref(bundle.site.slug, design.scheduleCtaHref || "/make-an-appointment/")}><span>{design.scheduleCtaLabel}</span></Link></div></div><img src={car} alt="Vehicle" /></div></section>
    <section className="micks-how-we-work section"><div className="container-site"><h2>{props.workHeading}</h2><img src={team} alt={`The ${name} team`} /><div className="micks-work-grid">{workItems.map(({ title, body }) => <div key={title}><StepListIcon design={design} label={title} /><b>{title}</b><span>{body}</span></div>)}</div></div></section>
    <section className="micks-owner section"><div className="container-site"><div className="micks-live-title"><QuoteMark design={design} className="micks-about-quote" /><h2>{props.ownerHeading}</h2></div><div className="micks-owner-grid"><img src={owner} alt="Mick Eggers" /><div>{ownerLabel && <p><strong>{ownerLabel}</strong>{ownerIntro && <><br />{ownerIntro}</>}</p>}{ownerParagraphs.slice(1).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></div></div></section>
    <section className="micks-crew-gallery"><div className="container-site">{crew.map((member) => <article className="micks-crew-card" key={member.name} tabIndex={0} aria-label={`${member.name}: ${member.description}`}><img src={member.imageUrl} alt={member.name} /><div className="micks-crew-card-overlay"><h3>{member.name}</h3><p>{member.description}</p></div></article>)}</div></section>
    <section className="micks-know-cta section"><div><h2>{props.finalHeading}</h2><p>{props.finalBody}</p><Link href={localSiteHref(bundle.site.slug, props.finalCta?.href || design.diagnosticsCtaHref || "/diagnostics/")}><span>{props.finalCta?.label}</span></Link></div></section>
  </>;
}

function MicksSmartTool({ bundle, kind }: { bundle: SiteBundle; kind: "diagnostics" | "tires" }) {
  const design = getDesign(bundle.theme ?? {});
  const diagnostics = kind === "diagnostics";
  const image = diagnostics ? (design.diagnosticsImageUrl || `${WP}/2026/06/Pre-Diagnostic-Tool-2.png`) : (design.tiresImageUrl || `${WP}/2026/04/tire-ai-2048x1365.jpg`);
  const integration = sharedToolConfig(bundle);
  const toolUrl = integration?.url;
  const cta = diagnostics ? "Start My Free Diagnosis" : "Find My Perfect Tire";
  const href = toolUrl || (diagnostics ? design.diagnosticsCtaHref : design.tiresCtaHref) || (diagnostics ? "/diagnostics/#tool" : "/tires/#tool");
  return <>
    <section className="micks-smart-intro section"><div className="container-site"><p className="micks-smart-kicker">{globalText(diagnostics ? "Smart free pre-diagnosis from {{businessName}}" : "Smart Tire Finder at {{businessName}}", bundle)}</p><div className="micks-smart-grid"><div><h2>Smarter Car Care for Worthington Drivers</h2><p>{globalText(diagnostics ? "{{businessName}} combines trusted local service with advanced technology to give you a smarter, more reliable automotive experience. Our skilled technicians bring years of hands-on expertise, while our modern diagnostic tools help identify issues before they turn into costly problems." : "{{businessName}} combines trusted local service with advanced technology to help you find the perfect tires and keep your vehicle performing at its best—anytime, anywhere.", bundle)}</p><a href={href}><span>{cta}</span></a></div><img src={image} alt="" /></div><div className="micks-smart-offer"><strong>Special Offer</strong><span>Our digital tools save you time and save us time. Bring in your online results and take $25 off your associated service.</span></div></div></section>
    <section className="micks-smart-tool section" id="tool"><div className="container-site"><h2>{diagnostics ? "Know the Problem Before You Visit." : "Smarter Tire Selection. Starts Here"}</h2><p>{diagnostics ? "Whether your dashboard light is on or your tires are wearing unevenly, our smart tools make it easy to get answers before you arrive." : "Built on real-world data and vehicle insights, the recommendations help you choose tires that match your needs before you arrive."}</p>{toolUrl ? <iframe src={toolUrl} title={diagnostics ? "Pre-diagnosis tool" : "Tire finder"} /> : <div className="micks-smart-tool-card"><h3>{diagnostics ? "Pre-Diagnosis Tool" : "Perfect Tire Tool"}</h3><p>{diagnostics ? "Tell us what’s going on with your vehicle. Our system analyzes your symptoms, provides possible causes and connects you with our certified staff." : "Enter your vehicle and priorities to instantly see tire options matched to your needs."}</p><a href={href}><span>{cta}</span></a></div>}</div></section>
    <section className="micks-smart-experience section"><div className="container-site micks-smart-grid"><img src={image} alt="" /><div><h2>Experience You Trust.<br />Technology That Delivers.</h2><p>For Worthington drivers, smart car care means combining local expertise with the best technology available.</p><p>At {bundle.settings?.businessName ?? bundle.site.name}, we make it simple to understand your car, plan repairs, and choose the right tires—all from one trusted shop.</p></div></div></section>
    <section className="micks-smart-cta section"><div><h2>{diagnostics ? "Something Feels Off? Start Your Free Diagnosis." : "Find the Perfect Tires. Fast."}</h2><p>{diagnostics ? "Describe your vehicle’s symptoms and get quick, accurate insights from real repair estimates and trusted local professionals." : "Match your driving style, vehicle, and budget with the right tires at competitive prices."}</p><a href={href}><span>{cta}</span></a></div></section>
  </>;
}

function MicksAppointment({ bundle, props }: { bundle: SiteBundle; props: BlockProps<"booking_form"> }) {
  const booking = bundle.booking;
  const rules = { slotMinutes: booking?.slotMinutes ?? 30, openTime: booking?.openTime ?? "07:30", closeTime: booking?.closeTime ?? "17:00", closedDays: booking?.closedDays ?? [0, 6] };
  return <section className="micks-appointment-page section" id="book"><div className="container-site"><BookingFormClient siteSlug={bundle.site.slug} slots={buildSlots(rules)} closedDays={rules.closedDays} disabledDates={booking?.disabledDates ?? []} leadDays={booking?.leadDays ?? 0} confirmation={booking?.confirmationMessage ?? "Thanks! We'll be in touch shortly to confirm."} fields={booking?.formFields ?? []} variant="appointment" appearance={booking?.appearance} heading={props.heading} subheading={props.subheading} /></div></section>;
}
