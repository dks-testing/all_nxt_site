/**
 * Applies the verified Mick's Repair homepage reference data to an existing
 * tenant without touching services, bookings, users, domains, or other pages.
 * Safe to rerun: the same theme and section values are written each time.
 */
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { closeDb, getDb } from "../src/client";
import * as s from "../src/schema";

const WP = "https://www.micksrepair.com/wp-content/uploads";
const db = getDb();

async function revalidateSite(siteId: string) {
  const base = process.env.SITES_APP_URL?.replace(/\/$/, "");
  const secret = process.env.REVALIDATE_SECRET;
  if (!base || !secret) {
    console.warn("Skipped Sites cache refresh because SITES_APP_URL or REVALIDATE_SECRET is not configured.");
    return;
  }
  try {
    const response = await fetch(`${base}/api/revalidate/`, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
      body: JSON.stringify({ siteId }),
    });
    if (response.ok) console.log(`Refreshed the Sites cache for ${siteId}.`);
    else console.warn(`Sites cache refresh returned HTTP ${response.status}; restart the local Sites app if it is already running.`);
  } catch {
    console.warn("Sites cache refresh could not reach the app; the next clean local start will load the synchronized content.");
  }
}

const hero = {
  heading: "HOMETOWN TRUST\nADVANCED EXPERTISE\nPICKUP - REPAIR - RETURN",
  subheading: "Honest answers. Modern diagnostics. And free pickup and delivery that saves you time.",
  primaryCta: { label: "Schedule Service", href: "/make-an-appointment/#book" },
  secondaryCta: { label: "Start with a Diagnosis", href: "/diagnostics/" },
  tertiaryCta: { label: "Find the Right Tires", href: "/tires/" },
  reviewImageUrl: `${WP}/2026/04/reviews-google.webp`,
  certificationLogos: [`${WP}/2026/04/Group.svg`, `${WP}/2026/04/ase-seeklogo-1-1.svg`],
  imageUrl: `${WP}/2026/04/Micks-Repair-Worthington.webp`,
  showRating: true,
  badges: [],
};

const trust = {
  items: [
    { title: "Local trust that’s earned", body: "We’ve built our reputation one customer at a time. When you bring your vehicle to Mick’s, you’re working with people who care about doing it right and standing behind their work." },
    { title: "Advanced diagnostics. Accurate repairs.", body: "Today’s vehicles are complex. We use modern diagnostic tools and proven repair methods to identify the real problem, so you’re not paying for guesswork." },
    { title: "We work around your schedule", body: "Auto repair shouldn’t disrupt your day. We offer free pickup and delivery, clear communication, and a process designed to save you time." },
    { title: "Clear answers. No pressure.", body: "We explain what’s going on, what your options are, and what actually needs to be done. No upselling. No confusion. Just straightforward guidance." },
  ],
  closingText: "We diagnose it clearly, explain it simply.\nWe treat every repair like we’re spending our own money.",
};

const about = {
  eyebrow: "About us",
  heading: "Straight answers. Expert guidance. Repairs you can trust.",
  body: "At Mick’s Repair, we’ve built our reputation by doing things the right way. For over 35 years, local families in Worthington have trusted us to diagnose issues accurately, explain what’s going on in plain language, and make sure every repair is done right the first time.\n\nConveniently located in historic downtown Worthington, right across from the courthouse, Mick’s has been part of the community for decades. During Turkey Days, people fill our sidewalk, parking lot, and even the front doorway to watch the parade go by.\n\nToday, Mick’s is run by Mick Eggers and his two sons, Kelly and Terry, carrying forward the same commitment to honest work and doing things the right way. No pressure. No unnecessary repairs. Just straightforward recommendations you can trust.\n\nWe know your time matters. That’s why we offer free pickup and delivery, making it easier to get your vehicle serviced without disrupting your day.\n\nEvery decision we make is based on what we would do if it were our own vehicle. That means focusing on what truly needs to be done and helping you move forward with confidence.",
  imageUrl: `${WP}/2026/04/mick-eggers.webp`,
  highlights: [],
  cta: { label: "About Us", href: "/about-us/" },
  certificationLogoUrl: `${WP}/2026/04/ase-seeklogo-1-1.svg`,
  variant: "micks-home",
};

const aiFeature = {
  heading: "Confused about your vehicle problem?",
  body: "Our AI tool is here to help.",
  integration: "ai_diagnostic",
  height: 700,
  variant: "micks-ai",
  imageUrl: `${WP}/2026/06/micks-repair-kelly-eggers-home.webp`,
  cta: { label: "Start diagnostic", href: "/diagnostics/" },
  offerHeading: "$25 OFF\ndiagnostic fee",
  offerBody: "For doing the pre-diagnostic, it saves us a little bit of time, we’ll take $25 off your diagnostic fee.",
};

const tireFeature = {
  heading: "THE RIGHT TIRE,\nFOR YOUR VEHICLE,\nBACKED BY REAL EXPERTS.",
  body: "GUS® Tire Finder gives you personalized recommendations based on your vehicle, how you drive, and what you care about. Backed by the experts at Mick’s Repair, it makes choosing the right tire simple.\n\nGet the right tire at the best value, without the guesswork.",
  integration: "tire_finder",
  height: 700,
  variant: "micks-tires",
  imageUrl: `${WP}/2026/06/wheel-alignment-micks-repair-home.webp`,
  cta: { label: "Find my tires", href: "/tires/" },
};

const diagnosticsSections: [string, Record<string, unknown>][] = [
  ["hero", {
    heading: "Diagnostics",
    subheading: "Smarter Car Diagnostics",
    primaryCta: { label: "Start Diagnostics", href: "/diagnostics/#tool" },
    secondaryCta: { label: "Find the Right Tires", href: "/tires/" },
    showRating: false,
    badges: [],
  }],
  ["smart_feature", {
    eyebrow: "Smart free pre-diagnosis from {{businessName}}",
    heading: "Smarter Car Care for Worthington Drivers",
    body: "{{businessName}} combines trusted local service with advanced technology to give you a smarter, more reliable automotive experience. Our skilled technicians bring years of hands-on expertise, while our modern diagnostic tools help quickly identify issues before they turn into costly problems. Whether you need help choosing the right tires, understanding a warning light, or keeping up with routine maintenance, we make the process simple and stress-free.\n\nWe believe car care should be convenient and transparent, which is why we offer clear recommendations, honest advice, and solutions tailored to your vehicle and driving needs. From quick check-ups to more complex repairs, {{businessName}} is committed to keeping your car performing at its best anytime, anywhere, so you can drive with confidence and peace of mind.",
    imageUrl: `${WP}/2026/04/micks-repair-worthington-mn-terry-eggers-835x1024.jpeg`,
    cta: { label: "Start My Free Diagnosis", href: "/diagnostics/#tool" },
    calloutHeading: "Special Offer",
    calloutBody: "Our digital tools save you time and save us time. We pass those savings back to you. Bring in your online results and take $25 off your associated service.",
    supportText: "Fast Results — 24/7 Support — Trusted MN Experts",
    variant: "intro",
    integration: "ai_diagnostic",
    showCertifications: false,
  }],
  ["smart_feature", {
    heading: "Know the Problem Before You Visit.",
    body: "Whether your dashboard light is on or your tires are wearing unevenly, our smart tools make it easy to get answers before you arrive.",
    imageUrl: `${WP}/2026/06/engine-prediagnostic-vinson.png`,
    secondaryImageUrl: `${WP}/2026/06/car-service-checking-2.png`,
    calloutHeading: "Pre-Diagnosis Tool",
    calloutBody: "Tell us what’s going on with your vehicle. Our system analyzes your symptoms, provides possible causes and repair estimates, and connects you directly with our certified staff.",
    cta: { label: "Start My Free Diagnosis", href: "/diagnostics/#tool" },
    supportText: "Fast Results — 24/7 Support — Trusted MN Experts",
    variant: "tool",
    integration: "ai_diagnostic",
    showCertifications: false,
  }],
  ["smart_feature", {
    heading: "Experience You Trust. Technology That Delivers.",
    body: "Worthington drivers, smart car care means combining local expertise with the best technology available.\n\nAt {{businessName}}, we make it simple to understand your car, plan repairs, and choose the right tires—all from one trusted shop.",
    imageUrl: `${WP}/2026/04/micks-repair-worthington-mn-terry-mick-kelly-eggers-1024x656.jpeg`,
    supportText: "Trusted in Worthington",
    variant: "experience",
    integration: "ai_diagnostic",
    showCertifications: false,
  }],
  ["smart_feature", {
    heading: "Something Feels Off? Start Your Free Diagnosis.",
    body: "Describe your vehicle’s symptoms and get quick, accurate insights from real repair estimates and trusted advice from the certified professionals at {{businessName}}.",
    imageUrl: `${WP}/2026/06/Pre-Diagnostic-Tool-2.png`,
    cta: { label: "Start My Free Diagnosis", href: "/diagnostics/#tool" },
    supportText: "Free • Instant results • Local expertise",
    variant: "cta",
    integration: "ai_diagnostic",
    showCertifications: false,
  }],
  ["smart_feature", {
    heading: "Worthington's Most Trusted Tire and Auto Experts",
    body: "{{businessName}} brings together decades of experience and advanced technology to help you diagnose issues, find the right tires, and keep your car running its best. Anytime. Anywhere.",
    supportText: "Certified Technicians • Family-Owned & Operated",
    variant: "trust",
    integration: "ai_diagnostic",
    showCertifications: true,
  }],
  ["smart_feature", {
    heading: "What Drivers Say About {{businessName}}",
    body: "“They always take great care of my vehicle and I can count on a fair price every time.”",
    imageUrl: `${WP}/2026/04/micks-repair-worthington-mn-customer-checkout.jpeg`,
    variant: "testimonial",
    integration: "ai_diagnostic",
    showCertifications: false,
  }],
  ["smart_feature", {
    heading: "Drive Smarter with Smart Tools",
    body: "From diagnosing issues to finding the right tires, everything starts with smart tools and trusted local care. Experience the balance of technology and craftsmanship, built for Worthington drivers.",
    imageUrl: `${WP}/2026/04/micks-repair-worthington-mn-kelly-eggers-1024x1024.jpeg`,
    cta: { label: "Start My Free Diagnosis", href: "/diagnostics/#tool" },
    supportText: "Fast – Local – Accurate",
    variant: "final",
    integration: "ai_diagnostic",
    showCertifications: false,
  }],
];

const tiresSections: [string, Record<string, unknown>][] = [
  ["hero", {
    heading: "Tires",
    subheading: "Smarter Tire Selection",
    primaryCta: { label: "Schedule Service", href: "/make-an-appointment/" },
    secondaryCta: { label: "Start Diagnostics", href: "/diagnostics/" },
    tertiaryCta: { label: "Find the Right Tires", href: "/tires/#tire-finder" },
    showRating: false,
    badges: [],
  }],
  ["smart_feature", {
    eyebrow: "Smart Tire Finder at {{businessName}}",
    heading: "Smarter Car Care for Worthington Drivers",
    body: "{{businessName}} combines trusted local service with advanced technology to help you find the perfect tires and keep your vehicle performing at its best anytime, anywhere.",
    imageUrl: `${WP}/2026/04/micks-repair-worthington-mn-terry-eggers-835x1024.jpeg`,
    cta: { label: "Find My Perfect Tire", href: "/tires/#tire-finder" },
    calloutHeading: "Special Offer",
    calloutBody: "Our digital tools save you time and save us time. We pass those savings back to you. Bring in your online results and take $25 off your associated service.",
    supportText: "Fast Results — 24/7 Support — Trusted MN Experts",
    variant: "intro",
    integration: "tire_finder",
    showCertifications: false,
  }],
  ["smart_feature", {
    heading: "Smarter Tire Selection. Starts Here",
    body: "Built on real-world data and vehicle insights, the recommendations help you choose tires that match your needs before you arrive.",
    imageUrl: `${WP}/2026/04/Tire-1.png`,
    secondaryImageUrl: `${WP}/2026/06/micksrepaire-tires.webp`,
    calloutHeading: "Perfect Tire Tool",
    calloutBody: "Enter your vehicle. Tell us your likes, dislikes, and priorities. Instantly see the best tire options. Tire shopping, finally made easy. Certified by local technicians.",
    cta: { label: "Find My Perfect Tire", href: "/tires/#tire-finder" },
    supportText: "Fast Results — 24/7 Support — Trusted MN Experts",
    variant: "tool",
    integration: "tire_finder",
    showCertifications: false,
  }],
  ["smart_feature", {
    heading: "Experience You Trust. Technology That Delivers.",
    body: "For Worthington drivers, smart car care means combining local expertise with the best technology available.\n\nAt {{businessName}}, we make it simple to understand your car, plan repairs, and choose the right tires all from one trusted shop.",
    imageUrl: `${WP}/2026/04/micks-repair-worthington-mn-terry-mick-kelly-eggers-1024x656.jpeg`,
    supportText: "Trusted in Worthington",
    variant: "experience",
    integration: "tire_finder",
    showCertifications: false,
  }],
  ["smart_feature", {
    heading: "Find the Perfect Tires. Fast.",
    body: "Use our Tire Finder to match your driving style, vehicle, and budget with the right tires at competitive prices. Compare brands and schedule installation with our experienced team.",
    imageUrl: `${WP}/2026/04/tire-ai-1024x683.jpg`,
    cta: { label: "Find My Perfect Tire", href: "/tires/#tire-finder" },
    supportText: "Best brands • Competitive prices • Expert installation",
    variant: "cta",
    integration: "tire_finder",
    showCertifications: false,
  }],
  ["smart_feature", {
    heading: "Worthington's Most Trusted Tire and Auto Experts",
    body: "{{businessName}} brings together decades of experience and advanced technology to help you diagnose issues, find the right tires, and keep your car running its best. Anytime. Anywhere.",
    supportText: "Certified Technicians • Family-Owned & Operated",
    variant: "trust",
    integration: "tire_finder",
    showCertifications: true,
  }],
  ["smart_feature", {
    heading: "What Drivers Say About {{businessName}}",
    body: "“They always take great care of my vehicle and I can count on a fair price every time.”",
    imageUrl: `${WP}/2026/04/micks-repair-worthington-mn-customer-checkout.jpeg`,
    variant: "testimonial",
    integration: "tire_finder",
    showCertifications: false,
  }],
  ["smart_feature", {
    heading: "Drive Smarter with Smart Tools",
    body: "From diagnosing issues to finding the right tires, everything starts with smart tools and trusted local care. Experience the balance of technology and craftsmanship, built for Worthington drivers.",
    imageUrl: `${WP}/2026/04/micks-repair-worthington-mn-kelly-eggers-1024x1024.jpeg`,
    cta: { label: "Find My Perfect Tire", href: "/tires/#tire-finder" },
    supportText: "Fast – Local – Accurate",
    variant: "final",
    integration: "tire_finder",
    showCertifications: false,
  }],
];

async function main() {
  const [site] = await db.select({ id: s.sites.id }).from(s.sites).where(eq(s.sites.slug, "micks-repair"));
  if (!site) throw new Error("The micks-repair tenant does not exist. Run db:seed first.");

  const [theme] = await db.select().from(s.themes).where(eq(s.themes.siteId, site.id));
  if (!theme) throw new Error("The micks-repair tenant has no theme row.");
  await db.update(s.themes).set({
    fonts: { ...(theme.fonts ?? {}), heading: "Nike Futura ND", body: "Poppins" },
    design: {
      ...(theme.design ?? {}), headerStyle: "angled", heroStyle: "micks-overlay",
      innerHeroImageUrl: `${WP}/2026/03/Micks-Repair-Worthington-MN-4-of-4.jpeg`,
      serviceDefaultImageUrl: `${WP}/2026/04/micks-repair-worthington-mn-terry-eggers.jpeg`,
      serviceBadgeOneUrl: `${WP}/2026/04/Group.svg`,
      serviceBadgeTwoUrl: `${WP}/2026/04/ase-seeklogo-1-1.svg`,
      serviceProcessImageUrl: `${WP}/2026/03/micks-repair-worthington-mn-sign.jpeg`,
      serviceTrustImageUrl: `${WP}/2026/04/555799130_25292959790311872_8516031389215206101_n.jpg`,
      serviceVehicleImageUrl: `${WP}/2026/04/blue-car.webp`,
      footerBackgroundImageUrl: `${WP}/2026/03/Micks-Repair-Worthington-MN-1-of-4.jpeg`,
      footerPoweredLink: "https://www.raiseahood.com/",
      footerPoweredText: "Powered by Raise a Hood",
      footerFacebookText: "Follow us on Facebook",
      aboutOwnerImageUrl: `${WP}/2026/04/micks-repair-worthington-mn-mick-eggers.jpeg`,
      aboutTeamImageUrl: `${WP}/2026/04/micks-repair-worthington-mn-team.jpeg`,
      aboutVehicleImageUrl: `${WP}/2026/04/blue-car.webp`,
      aboutCrewImageOneUrl: `${WP}/2026/04/micks-repair-worthington-mn-kelly-eggers.jpeg`,
      aboutCrewImageTwoUrl: `${WP}/2026/04/micks-repair-worthington-mn-terry-eggers.jpeg`,
      aboutCrewImageThreeUrl: `${WP}/2026/04/micks-repair-worthington-mn-customer-checkout.jpeg`,
      aboutWorkItems: [
        { title: "Straight-Talk Quotes", body: "No surprise add-ons; you approve every line before we touch a bolt." },
        { title: "Speed With Integrity", body: "Same-day turnaround on most jobs; never at the cost of quality." },
        { title: "Tools & Talent", body: "ASE-certified techs + factory-level diagnostics." },
        { title: "Neighbors First", body: "We live where we work, and our name rides on every repair." },
      ],
      diagnosticsImageUrl: `${WP}/2026/06/Pre-Diagnostic-Tool-2.png`,
      tiresImageUrl: `${WP}/2026/04/tire-ai-2048x1365.jpg`,
      scheduleCtaHref: "/make-an-appointment/", diagnosticsCtaHref: "/diagnostics/", tiresCtaHref: "/tires/#tire-finder",
    },
  }).where(eq(s.themes.siteId, site.id));

  const [home] = await db.select({ id: s.pages.id }).from(s.pages)
    .where(and(eq(s.pages.siteId, site.id), eq(s.pages.slug, "")));
  if (!home) throw new Error("The micks-repair home page does not exist.");
  const sections = await db.select({ id: s.pageSections.id, type: s.pageSections.type, props: s.pageSections.props }).from(s.pageSections)
    .where(and(eq(s.pageSections.siteId, site.id), eq(s.pageSections.pageId, home.id)));
  const values: Record<string, Record<string, unknown>> = {
    hero,
    trust_cards: trust,
    about,
    case_studies: {
      heading: "Proven repairs. Trusted outcomes.",
      subheading: "At Mick’s, the focus is simple: diagnose problems accurately and fix them right. Here are real examples from vehicles we’ve serviced.",
      closingText: "Every vehicle tells a different story. Our job is to diagnose it correctly and fix only what’s needed to get you back on the road safely.",
      labels: ["Diagnostic Case", "Customer Concern", "Verified Repair"],
      variant: "micks-home",
    },
    reviews: { heading: "Our happy customers", limit: 6, variant: "micks-home" },
    contact_map: { heading: "405 10th St, Worthington", variant: "micks-home" },
    booking_form: { heading: "Book Your Service", subheading: "No payment required. Quick and easy in minutes. We’ll confirm with you." },
  };
  const order: Record<string, number> = { hero: 0, trust_cards: 1, about: 2, case_studies: 5, reviews: 6, contact_map: 7, booking_form: 8 };
  let hasTireFeature = false;
  for (const section of sections) {
    const existingVariant = typeof section.props?.variant === "string" ? section.props.variant : "";
    if (section.type === "embed") {
      const integration = section.props?.integration;
      const isTire = integration === "tire_finder" || existingVariant === "micks-tires";
      hasTireFeature ||= isTire;
      await db.update(s.pageSections).set({ props: isTire ? tireFeature : aiFeature, sortOrder: isTire ? 4 : 3, isVisible: true }).where(eq(s.pageSections.id, section.id));
      continue;
    }
    if (section.type === "services_grid" || section.type === "specials") {
      await db.update(s.pageSections).set({ isVisible: false }).where(eq(s.pageSections.id, section.id));
      continue;
    }
    const props = values[section.type];
    if (props) await db.update(s.pageSections).set({ props, sortOrder: order[section.type] ?? 0, isVisible: true }).where(eq(s.pageSections.id, section.id));
  }
  if (!hasTireFeature) await db.insert(s.pageSections).values({ id: randomUUID(), siteId: site.id, pageId: home.id, type: "embed", props: tireFeature, sortOrder: 4, isVisible: true });

  const [diagnosticsPage] = await db.select({ id: s.pages.id }).from(s.pages)
    .where(and(eq(s.pages.siteId, site.id), eq(s.pages.slug, "diagnostics")));
  if (!diagnosticsPage) throw new Error("The micks-repair diagnostics page does not exist.");
  await db.transaction(async (tx) => {
    await tx.delete(s.pageSections).where(and(eq(s.pageSections.siteId, site.id), eq(s.pageSections.pageId, diagnosticsPage.id)));
    await tx.insert(s.pageSections).values(diagnosticsSections.map(([type, props], sortOrder) => ({
      id: randomUUID(), siteId: site.id, pageId: diagnosticsPage.id, type, props, sortOrder, isVisible: true,
    })));
  });

  const [tiresPage] = await db.select({ id: s.pages.id }).from(s.pages)
    .where(and(eq(s.pages.siteId, site.id), eq(s.pages.slug, "tires")));
  if (!tiresPage) throw new Error("The micks-repair tires page does not exist.");
  await db.transaction(async (tx) => {
    await tx.delete(s.pageSections).where(and(eq(s.pageSections.siteId, site.id), eq(s.pageSections.pageId, tiresPage.id)));
    await tx.insert(s.pageSections).values(tiresSections.map(([type, props], sortOrder) => ({
      id: randomUUID(), siteId: site.id, pageId: tiresPage.id, type, props, sortOrder, isVisible: true,
    })));
  });

  const caseRows = await db.select().from(s.caseStudies).where(eq(s.caseStudies.siteId, site.id));
  const caseImages = [`${WP}/2026/06/engine-micks-home.webp`, `${WP}/2026/06/suspension-micks-home.webp`, `${WP}/2026/06/start-stop-micks-home.webp`];
  const caseCopy = [
    { title: "Check engine light. No guesswork.", problem: "Intermittent check engine light traced to a failing ignition coil and resolved.", diagnosis: null, fix: null },
    { title: "Suspension noise traced and fixed.", problem: "Clunking over bumps traced to worn control arm bushings and corrected to restore handling.", diagnosis: null, fix: null },
    { title: "No-start diagnosed correctly", problem: "Intermittent no-start traced to a failing starter and repaired without unnecessary replacement.", diagnosis: null, fix: null },
  ];
  for (const [index, row] of caseRows.sort((a, b) => a.sortOrder - b.sortOrder).entries()) {
    await db.update(s.caseStudies).set({ imageUrl: caseImages[index] ?? row.imageUrl, ...(caseCopy[index] ?? {}) }).where(eq(s.caseStudies.id, row.id));
  }
  const existingTestimonials = await db.select({ id: s.testimonials.id }).from(s.testimonials).where(eq(s.testimonials.siteId, site.id));
  if (existingTestimonials.length === 0) {
    await db.insert(s.testimonials).values([
      { id: randomUUID(), siteId: site.id, author: "Rachel Backes", rating: 5, body: "What a hometown hero! Our check engine light went on Friday afternoon on our way to a gymnastics tournament. Mick’s helped us quickly and treated us like neighbors.", source: "google", sortOrder: 0, isActive: true },
      { id: randomUUID(), siteId: site.id, author: "Concert on the Lake", rating: 5, body: "Our van broke down on our way across southern Minnesota. A friend said to take it to Mick’s, and the team got us back on the road.", source: "google", sortOrder: 1, isActive: true },
      { id: randomUUID(), siteId: site.id, author: "Leon S", rating: 1, body: "Mick seems nice enough and I can’t be too sure everyone else working here is complicit in the lies told by a Mr. Kelly.", source: "google", sortOrder: 2, isActive: true },
    ]);
  }
  const serviceRows = await db.select().from(s.services).where(eq(s.services.siteId, site.id));
  const exactCopy: Record<string, { heading: string; intro: string[]; listHeading: string; bullets: string[]; closing: string }> = {
    "brake-repair-safety-checks": {
      heading: "Your brakes matter",
      intro: [
        "Your brakes are the single most important safety system on your vehicle—no debate. They’re what stand between you and a potential accident, giving you control when it matters most.",
        "Ignoring early warning signs like squealing, grinding, or reduced response can quickly turn small, affordable fixes into major repairs. Even worse, it can lead to longer stopping distances and serious safety risks on the road.",
      ],
      listHeading: "Red-flag symptoms",
      bullets: ["Car pulls left or right when you brake", "Pedal feels soft or sinks toward the floor", "Vibration or steering wheel shake at stoplights", "Squealing, grinding, or metal on metal noises"],
      closing: "Feel any of these? Book a quick check before the problem snowballs.",
    },
    "engine-repair": {
      heading: "Love your engine",
      intro: [
        "Your engine is the heart of your vehicle, powering every journey with smooth, reliable performance and efficiency. When it’s in good condition, your car responds better, runs stronger, and gives you confidence on the road.",
        "Ignoring early warning signs like strange noises, reduced power, or dashboard alerts can quickly turn minor issues into major, costly breakdowns. Regular maintenance helps prevent damage, extends engine life, and keeps your vehicle safe and dependable.",
      ],
      listHeading: "Trouble signs to catch early",
      bullets: ["Knocking, ticking, or unusual engine noises", "Loss of power or poor acceleration", "Excessive smoke from exhaust", "Engine overheating or temperature spikes", "Check engine light staying on", "Rough idling or stalling"],
      closing: "If you notice any of these, it’s best to get it checked before it leads to major damage.",
    },
  };
  for (const service of serviceRows) {
    const copy = exactCopy[service.slug];
    const body = copy ? `# ${copy.heading}\n\n${copy.intro.join("\n\n")}\n\n## ${copy.listHeading}\n\n${copy.closing}` : service.body;
    await db.update(s.services).set({ imageUrl: service.imageUrl || `${WP}/2026/04/micks-repair-worthington-mn-terry-eggers.jpeg`, ...(copy ? { body, bullets: copy.bullets } : {}) }).where(eq(s.services.id, service.id));
  }
  await revalidateSite(site.id);
  console.log("Synchronized the complete Mick's Repair landing page, theme, and service assets.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(closeDb);
