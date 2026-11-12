import Link from "next/link";
import type { SiteBundle } from "@platform/db";
import { buildSlots } from "@platform/db/booking";
import { getDesign } from "@platform/db/theme";
import { getServices, getTestimonials, type SiteCtx } from "@/lib/data";
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

const WP = "https://www.micksrepair.com/wp-content/uploads";

export async function MicksContentPage({ pageSlug, bundle, ctx }: { pageSlug: string; bundle: SiteBundle; ctx: SiteCtx }) {
  const headings: Record<string, string> = {
    "about-us": "About Us",
    diagnostics: "Diagnostics",
    tires: "Tires",
    specials: "Specials",
    testimonials: "Testimonials",
    "make-an-appointment": "Make an Appointment",
    services: "Yea, We Can Fix That",
  };
  return <>
    <MicksInnerHero bundle={bundle} heading={headings[pageSlug] ?? pageSlug} variant={pageSlug === "services" ? "service" : "page"} />
    {pageSlug === "services" && <MicksServices bundle={bundle} ctx={ctx} />}
    {pageSlug === "about-us" && <MicksAbout bundle={bundle} />}
    {pageSlug === "diagnostics" && <MicksSmartTool bundle={bundle} kind="diagnostics" />}
    {pageSlug === "tires" && <MicksSmartTool bundle={bundle} kind="tires" />}
    {pageSlug === "specials" && <MicksSpecials bundle={bundle} ctx={ctx} />}
    {pageSlug === "testimonials" && <MicksTestimonials bundle={bundle} ctx={ctx} />}
    {pageSlug === "make-an-appointment" && <MicksAppointment bundle={bundle} />}
  </>;
}

const serviceCardImages: Record<string, string> = {
  "diagnostics-check-engine-light": `${WP}/2026/04/dnd-services-check-engine-light.webp`,
  "brake-repair-safety-checks": `${WP}/2026/04/dnd-services-brake-repair.webp`,
  "engine-repair": `${WP}/2026/04/dnd-services-tune-up-service.webp`,
  "transmission-service-repair": `${WP}/2026/04/dnd-services-transmission-service.webp`,
  "steering-suspension-service": `${WP}/2026/04/dnd-services-steering-suspension.webp`,
  "a-c-repair-recharge": `${WP}/2026/04/dnd-services-ac-repair.webp`,
  "electrical-systems": `${WP}/2026/04/dnd-services-starting-charging.webp`,
  "quick-change-oil-service": `${WP}/2026/04/dnd-services-oil-change-fluid.webp`,
  "tire-services-alignment": `${WP}/2026/03/Micks-Repair-Worthington-MN-4-of-4.jpeg`,
  "cooling-system-repair": `${WP}/2026/04/dnd-services-cooling-system.webp`,
  "battery-alternator-starter": `${WP}/2026/04/Battery-Alternator-Starter-scaled.jpg`,
  "exhaust-emissions": `${WP}/2026/04/Exhaust-Emissions-scaled.jpg`,
  "fuel-system-repair": `${WP}/2026/04/Fuel-System-Repair-scaled.jpg`,
  "drivetrain-axles": `${WP}/2026/04/Drivetrain-Axles-scaled.jpg`,
  "preventative-maintenance": `${WP}/2026/04/Preventative-Maintenance-scaled.jpg`,
  "vehicle-inspections-pre-purchase": `${WP}/2026/04/Vehicle-Inspections-Pre-Purchase-scaled.jpg`,
};

async function MicksServices({ bundle, ctx }: { bundle: SiteBundle; ctx: SiteCtx }) {
  const services = await getServices(ctx);
  const name = bundle.settings?.businessName ?? bundle.site.name;
  return <section className="micks-services-index section"><div className="container-site">
    <h2>Comprehensive Automotive Solutions at {name}<br />in Worthington</h2>
    <p className="micks-services-intro">At {name} in Worthington, we provide a complete range of automotive maintenance and repair services to keep your vehicle performing at its best. Our skilled technicians handle everything from routine upkeep to complex repairs with accuracy and care.</p>
    <div className="micks-services-grid">{services.map((service) => {
      const configuredImage = service.imageUrl && !service.imageUrl.includes("terry-eggers") ? service.imageUrl : undefined;
      const image = configuredImage || serviceCardImages[service.slug] || `${WP}/2026/04/dnd-services-tune-up-service.webp`;
      return <article key={service.id} style={{ backgroundImage: `linear-gradient(180deg,#0002 10%,#000e 100%),url(${JSON.stringify(image)})` }}>
        <h3>{service.name}</h3>
        {service.summary && <p>{service.summary}</p>}
        <Link href={localSiteHref(bundle.site.slug, `/${service.slug}/`)}>Read More</Link>
      </article>;
    })}</div>
  </div></section>;
}

function MicksAbout({ bundle }: { bundle: SiteBundle }) {
  const design = getDesign(bundle.theme ?? {});
  const settings = bundle.settings;
  const name = settings?.businessName ?? bundle.site.name;
  const address = formatAddress(settings?.address);
  const owner = design.aboutOwnerImageUrl || `${WP}/2026/04/micks-repair-worthington-mn-mick-eggers.jpeg`;
  const team = design.aboutTeamImageUrl || `${WP}/2026/04/micks-repair-worthington-mn-team.jpeg`;
  const car = design.aboutVehicleImageUrl || `${WP}/2026/04/blue-car.webp`;
  const crew = [
    design.aboutCrewImageOneUrl || `${WP}/2026/04/micks-repair-worthington-mn-kelly-eggers.jpeg`,
    design.aboutCrewImageTwoUrl || `${WP}/2026/04/micks-repair-worthington-mn-terry-eggers.jpeg`,
    design.aboutCrewImageThreeUrl || `${WP}/2026/04/micks-repair-worthington-mn-customer-checkout.jpeg`,
  ];
  const workItems = design.aboutWorkItems?.length ? design.aboutWorkItems : [
    { title: "Straight-Talk Quotes", body: "No surprise add-ons; you approve every line before we touch a bolt." },
    { title: "Speed With Integrity", body: "Same-day turnaround on most jobs; never at the cost of quality." },
    { title: "Tools & Talent", body: "ASE-certified techs + factory-level diagnostics." },
    { title: "Neighbors First", body: "We live where we work, and our name rides on every repair." },
  ];
  return <>
    <section className="micks-about-page-intro section"><div className="container-site micks-about-page-grid">
      <img src={owner} alt={`Mick Eggers at ${name}`} />
      <div><div className="micks-live-title"><QuoteMark design={design} className="micks-about-quote" /><h2>About Us</h2></div><h3>Straight answers. Expert guidance.<br />Repairs you can trust.</h3>
        <p>At {name}, we’ve built our reputation by doing things the right way. For over 35 years, local families in Worthington have trusted us to diagnose issues accurately, explain what’s going on in plain language, and make sure every repair is done right the first time.</p>
        <p>Conveniently located in historic downtown Worthington, right across from the courthouse, {name} has been part of the community for decades. During Turkey Days, people fill our sidewalk, parking lot, and even the front doorway to watch the parade go by.</p>
        <p>Today, {name} is run by Mick Eggers and his two sons, Kelly and Terry, carrying forward the same commitment to honest work and doing things the right way. No pressure. No unnecessary repairs. Just straightforward recommendations you can trust.</p>
        <p>We know your time matters. That’s why we offer free pickup and delivery, making it easier to get your vehicle serviced without disrupting your day.</p>
        <p>Every decision we make is based on what we would do if it were our own vehicle. That means focusing on what truly needs to be done and helping you move forward with confidence.</p>
        <CertificationBadges design={design} className="micks-about-badges" />
      </div>
    </div></section>
    <section className="micks-mission section"><div className="container-site micks-mission-grid"><div><h2>One Shop, One Mission</h2><h3>Keep our neighbors rolling with honest,<br />high-quality auto care.</h3><div className="micks-mission-table"><b>Location</b><b>Phone</b><b>Hours</b><span>{address}</span><a href={telHref(settings?.phone)}>{settings?.phone}</a><span>{groupHours(settings?.hours)[0]?.days}: {groupHours(settings?.hours)[0]?.time}</span></div><div className="micks-live-buttons">{settings?.phone && <a href={telHref(settings.phone)}>Call Now</a>}<Link href={localSiteHref(bundle.site.slug, design.scheduleCtaHref || "/make-an-appointment/")}>Schedule Service</Link></div></div><img src={car} alt="Vehicle" /></div></section>
    <section className="micks-how-we-work section"><div className="container-site"><h2>How We Work</h2><img src={team} alt={`The ${name} team`} /><div className="micks-work-grid">{workItems.map(({ title, body }) => <div key={title}><StepListIcon design={design} label={title} /><b>{title}</b><span>{body}</span></div>)}</div></div></section>
    <section className="micks-owner section"><div className="container-site"><div className="micks-live-title"><QuoteMark design={design} className="micks-about-quote" /><h2>Meet the Crew</h2></div><div className="micks-owner-grid"><img src={owner} alt="Mick Eggers" /><div><p><strong>Mick Eggers</strong><br />Founder of {name}, Mick Eggers has spent his entire life building a reputation in the Worthington automotive community. For over 35 years, he has led a shop grounded in honesty, transparency, and long-term customer relationships. Today, he’s joined by his two sons, Kelly and Terry, continuing a tradition that has become a trusted name for generations of local families.</p><p>Spend a few minutes in the lobby and you’ll see what sets this place apart. It’s not uncommon to hear a technician, or Mick himself, advising a customer not to move forward with a repair when the cost doesn’t make sense for the vehicle.</p><p>Mick Eggers represents a rare combination of technical expertise, relentless work ethic, and unwavering integrity. It’s what defines {name} and why it continues to earn the trust of the community year after year.</p></div></div></div></section>
    <section className="micks-crew-gallery"><div className="container-site">{crew.map((src, index) => <img key={src} src={src} alt={["Kelly Eggers", "Terry Eggers", `${name} technician`][index]} />)}</div></section>
    <section className="micks-know-cta section"><div><h2>Know Before You Go.</h2><p>Describe what you’re seeing and get a clear answer in seconds.</p><Link href={localSiteHref(bundle.site.slug, design.diagnosticsCtaHref || "/diagnostics/")}>Start Diagnosis</Link></div></section>
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
    <section className="micks-smart-intro section"><div className="container-site"><p className="micks-smart-kicker">{globalText(diagnostics ? "Smart free pre-diagnosis from {{businessName}}" : "Smart Tire Finder at {{businessName}}", bundle)}</p><div className="micks-smart-grid"><div><h2>Smarter Car Care for Worthington Drivers</h2><p>{globalText(diagnostics ? "{{businessName}} combines trusted local service with advanced technology to give you a smarter, more reliable automotive experience. Our skilled technicians bring years of hands-on expertise, while our modern diagnostic tools help identify issues before they turn into costly problems." : "{{businessName}} combines trusted local service with advanced technology to help you find the perfect tires and keep your vehicle performing at its best—anytime, anywhere.", bundle)}</p><a href={href}>{cta}</a></div><img src={image} alt="" /></div><div className="micks-smart-offer"><strong>Special Offer</strong><span>Our digital tools save you time and save us time. Bring in your online results and take $25 off your associated service.</span></div></div></section>
    <section className="micks-smart-tool section" id="tool"><div className="container-site"><h2>{diagnostics ? "Know the Problem Before You Visit." : "Smarter Tire Selection. Starts Here"}</h2><p>{diagnostics ? "Whether your dashboard light is on or your tires are wearing unevenly, our smart tools make it easy to get answers before you arrive." : "Built on real-world data and vehicle insights, the recommendations help you choose tires that match your needs before you arrive."}</p>{toolUrl ? <iframe src={toolUrl} title={diagnostics ? "Pre-diagnosis tool" : "Tire finder"} /> : <div className="micks-smart-tool-card"><h3>{diagnostics ? "Pre-Diagnosis Tool" : "Perfect Tire Tool"}</h3><p>{diagnostics ? "Tell us what’s going on with your vehicle. Our system analyzes your symptoms, provides possible causes and connects you with our certified staff." : "Enter your vehicle and priorities to instantly see tire options matched to your needs."}</p><a href={href}>{cta}</a></div>}</div></section>
    <section className="micks-smart-experience section"><div className="container-site micks-smart-grid"><img src={image} alt="" /><div><h2>Experience You Trust.<br />Technology That Delivers.</h2><p>For Worthington drivers, smart car care means combining local expertise with the best technology available.</p><p>At {bundle.settings?.businessName ?? bundle.site.name}, we make it simple to understand your car, plan repairs, and choose the right tires—all from one trusted shop.</p></div></div></section>
    <section className="micks-smart-cta section"><div><h2>{diagnostics ? "Something Feels Off? Start Your Free Diagnosis." : "Find the Perfect Tires. Fast."}</h2><p>{diagnostics ? "Describe your vehicle’s symptoms and get quick, accurate insights from real repair estimates and trusted local professionals." : "Match your driving style, vehicle, and budget with the right tires at competitive prices."}</p><a href={href}>{cta}</a></div></section>
  </>;
}

async function MicksTestimonials({ bundle, ctx }: { bundle: SiteBundle; ctx: SiteCtx }) {
  const stored = await getTestimonials(ctx);
  const items = stored.length ? stored : [
    { id: "r1", author: "Rachel Backes", rating: 5, reviewDate: "7 months ago", body: "What a hometown hero! Our check engine light went on Friday afternoon on our way to a gymnastics tournament. These guys were phenomenal and got us back on the road." },
    { id: "r2", author: "Concert on the Lake Thibault", rating: 5, reviewDate: "8 months ago", body: "Our van broke down on our way across southern Minnesota. Mick’s diagnosed the problem and went out of the way to get us back on the road." },
    { id: "r3", author: "Michael Petersen", rating: 5, reviewDate: "5 months ago", body: "They did a great job at a very reasonable rate. Best shop in town!" },
  ];
  const settings = bundle.settings;
  return <section className="micks-testimonials-page section"><div className="container-site"><h2>What Our Customers are Saying About {settings?.businessName ?? bundle.site.name}</h2><div className="micks-testimonial-summary"><strong>{settings?.businessName}</strong>{settings?.ratingValue && <span><b>{settings.ratingValue}</b><Stars value={Number(settings.ratingValue)} /></span>}{settings?.ratingCount && <small>Based on {settings.ratingCount} reviews</small>}{settings?.social?.google && <a href={settings.social.google}>Review us on Google</a>}</div><div className="micks-testimonial-grid">{items.map((item) => <article key={item.id}><div><span>{item.author.charAt(0)}</span><strong>{item.author}</strong><b>G</b></div>{item.reviewDate && <small>{item.reviewDate}</small>}<Stars value={item.rating} /><p>{item.body}</p></article>)}</div></div></section>;
}

function MicksAppointment({ bundle }: { bundle: SiteBundle }) {
  const booking = bundle.booking;
  const rules = { slotMinutes: booking?.slotMinutes ?? 30, openTime: booking?.openTime ?? "07:30", closeTime: booking?.closeTime ?? "17:00", closedDays: booking?.closedDays ?? [0, 6] };
  return <section className="micks-appointment-page section" id="book"><div className="container-site"><BookingFormClient siteSlug={bundle.site.slug} slots={buildSlots(rules)} closedDays={rules.closedDays} disabledDates={booking?.disabledDates ?? []} leadDays={booking?.leadDays ?? 0} confirmation={booking?.confirmationMessage ?? "Thanks! We'll be in touch shortly to confirm."} fields={booking?.formFields ?? []} variant="appointment" appearance={booking?.appearance} /></div></section>;
}
