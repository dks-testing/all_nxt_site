/**
 * Seeds the platform with Mick's Repair (migrated from micksrepair.com) and a super-admin.
 * Safe to re-run: creates only missing initial data. Never overwrites existing sites.
 *
 * Copy is condensed from the live WordPress site; replace with exact wording in the admin if needed.
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, closeDb } from "../src/client";
import * as s from "../src/schema";
import type { BlockType } from "../src/blocks";

const db = getDb();
const SLUG = "micks-repair";
const WP = "https://www.micksrepair.com/wp-content/uploads";

const hours: s.DayHours[] = [
  { day: "Mon", open: "07:30", close: "17:00" },
  { day: "Tue", open: "07:30", close: "17:00" },
  { day: "Wed", open: "07:30", close: "17:00" },
  { day: "Thu", open: "07:30", close: "17:00" },
  { day: "Fri", open: "07:30", close: "17:00" },
  { day: "Sat", closed: true },
  { day: "Sun", closed: true },
];
const address: s.Address = { street: "405 10th St", city: "Worthington", region: "MN", postalCode: "56187", country: "US" };

async function main() {
  // ---------- super admin ----------
  const email = (process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "";
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 12) {
    throw new Error("Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD (12+ characters) in .env");
  }
  const [existingUser] = await db.select().from(s.users).where(eq(s.users.email, email));
  let adminId = existingUser?.id;
  if (existingUser && existingUser.globalRole !== "SUPER_ADMIN") {
    throw new Error("The seed email exists without SUPER_ADMIN permission. Choose another email or update it deliberately through admin access.");
  }
  if (!existingUser) {
    adminId = crypto.randomUUID();
    await db.insert(s.users).values({ id: adminId, email, name: "Platform Admin", passwordHash: await bcrypt.hash(password, 10), globalRole: "SUPER_ADMIN" });
    console.log(`Created super-admin ${email}`);
  }

  // ---------- seed only when the site is absent ----------
  // This is essential because re-seeding a live multi-tenant database must not erase edits.
  const [old] = await db.select().from(s.sites).where(eq(s.sites.slug, SLUG));
  if (old) {
    console.log(`Site ${SLUG} already exists (${old.id}). No site data was changed.`);
    return;
  }

  const siteId = crypto.randomUUID();
  await db.insert(s.sites).values({ id: siteId, name: "Mick's Repair", slug: SLUG, status: "PUBLISHED", publishedAt: new Date(), createdBy: adminId });

  // No live domain/DNS setup is needed for local development.
  // Domains are deliberately not seeded. Configure them later only if needed.

  await db.insert(s.siteSettings).values({
    siteId,
    businessName: "Mick's Repair",
    tagline: "Hometown trust. Advanced expertise. Pickup, repair, return.",
    phone: "(507) 376-3095",
    email: null,
    address,
    hours,
    social: { google: "https://www.google.com/maps/search/?api=1&query=Mick%27s+Repair+405+10th+St+Worthington+MN" },
    ratingValue: "4.6",
    ratingCount: 84,
    businessType: "AutoRepair",
    serviceArea: "Worthington, MN and the surrounding area, with free pickup and delivery",
    footerNote: "Family-owned in historic downtown Worthington for over 35 years.",
  });

  await db.insert(s.themes).values({
    siteId,
    logoUrl: `${WP}/2025/10/logo-micks-repairs-1.webp`,
    faviconUrl: `${WP}/2025/10/logo-2.png`,
    colors: {
      primary: "#b91c1c",
      primaryForeground: "#ffffff",
      secondary: "#111827",
      accent: "#f59e0b",
      background: "#ffffff",
      surface: "#f3f4f6",
      text: "#111827",
      muted: "#4b5563",
    },
    fonts: { heading: "Oswald", body: "Poppins" },
    radius: "0.5rem",
    buttonStyle: "rounded",
    design: {
      headerStyle: "angled", heroStyle: "micks-overlay", buttonBackground: "#c62828", buttonText: "#ffffff",
      buttonHoverBackground: "#ad2222", buttonHoverText: "#ffffff",
      buttonSkew: -14, buttonHoverTranslateY: -2,
      badgeBackground: "#6c94ba", badgeText: "#ffffff",
      innerHeroImageUrl: `${WP}/2026/03/Micks-Repair-Worthington-MN-4-of-4.jpeg`,
      serviceDefaultImageUrl: `${WP}/2026/04/micks-repair-worthington-mn-terry-eggers.jpeg`,
      serviceBadgeOneUrl: `${WP}/2026/04/Group.svg`,
      serviceBadgeTwoUrl: `${WP}/2026/04/ase-seeklogo-1-1.svg`,
      serviceProcessImageUrl: `${WP}/2026/03/micks-repair-worthington-mn-sign.jpeg`,
      serviceTrustImageUrl: `${WP}/2026/04/555799130_25292959790311872_8516031389215206101_n.jpg`,
      serviceVehicleImageUrl: `${WP}/2026/04/blue-car.webp`,
      footerBackgroundImageUrl: `${WP}/2026/03/Micks-Repair-Worthington-MN-1-of-4.jpeg`,
      aboutOwnerImageUrl: `${WP}/2026/04/micks-repair-worthington-mn-mick-eggers.jpeg`,
      aboutTeamImageUrl: `${WP}/2026/04/micks-repair-worthington-mn-team.jpeg`,
      aboutVehicleImageUrl: `${WP}/2026/04/blue-car.webp`,
      aboutCrewImageOneUrl: `${WP}/2026/04/micks-repair-worthington-mn-kelly-eggers.jpeg`,
      aboutCrewImageTwoUrl: `${WP}/2026/04/micks-repair-worthington-mn-terry-eggers.jpeg`,
      aboutCrewImageThreeUrl: `${WP}/2026/04/micks-repair-worthington-mn-customer-checkout.jpeg`,
      diagnosticsImageUrl: `${WP}/2026/06/Pre-Diagnostic-Tool-2.png`,
      tiresImageUrl: `${WP}/2026/04/tire-ai-2048x1365.jpg`,
      scheduleCtaHref: "/make-an-appointment/", diagnosticsCtaHref: "/diagnostics/", tiresCtaHref: "/tires/",
    },
  });

  await db.insert(s.locations).values({ siteId, name: "Worthington", address, phone: "(507) 376-3095", hours, lat: "43.6196", lng: "-95.5964", isPrimary: true });

  await db.insert(s.bookingSettings).values({
    siteId,
    enabled: true,
    slotMinutes: 30,
    openTime: "07:30",
    closeTime: "16:30",
    closedDays: [0, 6],
    leadDays: 0,
    notifyEmails: [],
    notifySms: [],
    confirmationMessage: "Thanks! We received your request and will contact you shortly to confirm your appointment.",
  });

  // ---------- services (slugs match the old WordPress URLs) ----------
  const svc: Array<[string, string, string, string[]?]> = [
    ["diagnostics-check-engine-light", "Diagnostics & Check Engine Light", "Factory-level scan tools and proven testing to find the real cause before anything is replaced.", ["Check engine light diagnosis", "Intermittent and no-start problems", "Plain-language findings before any repair"]],
    ["brake-repair-safety-checks", "Brake Repair & Safety Checks", "Pads, rotors, calipers, lines and ABS diagnostics so you stop straight and quietly.", ["Squeaking, grinding or pulsing brakes", "ABS and brake warning lights", "Free brake inspection with service"]],
    ["engine-repair", "Engine Repair", "From minor leaks and tune-ups to major engine repairs, done right the first time.", ["Ignition, sensors and misfires", "Leaks, gaskets and timing components", "Cooling-related engine damage"]],
    ["transmission-service-repair", "Transmission Service & Repair", "Fluid service, diagnosis and repair for automatic and manual transmissions.", ["Slipping, harsh or delayed shifts", "Transmission fluid service", "Parts sourcing for hard-to-find units"]],
    ["steering-suspension-service", "Steering & Suspension", "Checks and repairs for a smooth ride, precise steering and a stable vehicle.", ["Clunks and noises over bumps", "Shocks, struts, bushings and ball joints", "Steering racks and tie rods"]],
    ["a-c-repair-recharge", "A/C Repair & Recharge", "Cooling in summer and heat in winter: A/C recharge, leak repair and heater service.", ["A/C performance check and recharge", "Leak detection and repair", "Heater and blower issues"]],
    ["electrical-systems", "Electrical Systems", "Wiring, sensors, lighting and module problems diagnosed and repaired.", ["Battery, alternator and starter", "Lighting and accessory faults", "Sensor and wiring diagnosis"]],
    ["quick-change-oil-service", "Oil Change & Fluid Service", "Quick, clean oil changes and fluid services with a multi-point inspection.", ["Conventional and full synthetic oil", "Filter replacement and fluid top-off", "Multi-point inspection included"]],
    ["tire-services-alignment", "Tire Services & Alignment", "New tires, rotation, balancing and precision 4-wheel alignment.", ["Tire sales and installation", "Rotation and balancing", "Precision 4-wheel alignment"]],
    ["cooling-system-repair", "Cooling System Repair", "Radiators, water pumps, hoses and thermostats to prevent overheating damage.", undefined],
    ["battery-alternator-starter", "Battery, Alternator & Starter", "Testing and repair of starting and charging systems.", undefined],
    ["exhaust-emissions", "Exhaust & Emissions Repair", "Exhaust repairs and emissions failure diagnosis to get you compliant.", undefined],
    ["fuel-system-repair", "Fuel System Repair", "Fuel pumps, injectors, tanks and lines cleaned, repaired or replaced.", undefined],
    ["drivetrain-axles", "Drivetrain & Axles", "CV axles, driveshafts, differentials and transfer cases.", undefined],
    ["preventative-maintenance", "Preventative Maintenance", "Scheduled maintenance that catches problems early and extends vehicle life.", undefined],
    ["vehicle-inspections", "Vehicle & Pre-Purchase Inspections", "Thorough inspections for buyers and current owners before a big decision.", undefined],
  ];
  await db.insert(s.services).values(
    svc.map(([slug, name, summary, bullets], i) => ({
      siteId,
      slug,
      name,
      summary,
      bullets: bullets ?? [],
      body: `# ${name}\n\n${summary}\n\nAt Mick's Repair, every repair starts with an accurate diagnosis and a clear explanation. You approve every line of the quote before work begins, and our ASE-certified technicians stand behind the work.\n\n## What we can help with\n\nCan't get away from work? We offer free pickup and delivery in the Worthington area.`,
      imageUrl: `${WP}/2026/04/micks-repair-worthington-mn-terry-eggers.jpeg`,
      seoTitle: `${name} in Worthington, MN | Mick's Repair`,
      seoDescription: `${summary} Serving Worthington, MN with free pickup and delivery. Call (507) 376-3095.`,
      sortOrder: i,
    })),
  );

  await db.insert(s.specials).values([
    { siteId, title: "Road Trip Ready Service Package", discount: "$149 (a $350+ value, save 60%)", couponCode: "ROAD TRIP", description: "Full synthetic oil change (up to 6 qts), tire condition, pressure and rotation, brake inspection, battery and charging test, coolant check, belts and hoses, suspension, steering and underbody check, and A/C performance check. No upsells, no pressure.", sortOrder: 0 },
    { siteId, title: "Precision 4-Wheel Alignment", discount: "$119 (normally $149, save 20%)", couponCode: "STRAIGHT 119", description: "Precision 4-wheel alignment, steering and suspension angle adjustment, tire wear evaluation, and before-and-after measurements.", sortOrder: 1 },
    { siteId, title: "Full Synthetic Oil Change", discount: "$79 (normally $99, save 20%)", couponCode: "OIL 79", description: "Full synthetic oil (up to 6 qts), new filter, fluid check and top-off, tire pressure check and a visual multi-point inspection.", sortOrder: 2 },
  ]);

  await db.insert(s.faqs).values(
    [
      ["What auto repair services does Mick's Repair offer?", "We handle oil changes, brakes, engine diagnostics, radiator and cooling, electrical, tune-ups, batteries, suspension and general maintenance."],
      ["Where is Mick's Repair located?", "We're at 405 10th St in downtown Worthington, Minnesota, across from the courthouse."],
      ["Do I need an appointment?", "Appointments are recommended to reduce wait times. Walk-ins may be accepted depending on shop availability."],
      ["Do you work on all makes and models?", "Yes. We service most domestic and imported cars, SUVs and light trucks."],
      ["How often should I change my oil?", "Most vehicles need an oil change every 3,000 to 7,500 miles, depending on driving habits, oil type and the manufacturer's recommendation."],
      ["What are common signs my brakes need repair?", "Squeaking, grinding, vibration when braking, longer stopping distances, or a brake warning light on the dash."],
      ["Can you diagnose check engine lights?", "Yes. We use professional diagnostic equipment to find and repair the cause of a check engine light."],
      ["Do you offer preventative maintenance?", "Yes. Preventative maintenance extends the life of your vehicle and reduces unexpected breakdowns."],
      ["Do you test and replace batteries?", "Yes. We inspect, test and replace automotive batteries."],
      ["How long does a typical repair take?", "Minor maintenance usually takes under an hour. Larger repairs take longer and we'll give you a time estimate after inspection."],
      ["Do you offer warranties on repairs?", "Yes. Many repairs and parts are covered by our 12-month/12,000-mile nationwide warranty. Ask us for details on your repair."],
      ["Do you offer pickup and delivery?", "Yes, free pickup and delivery in the Worthington area."],
    ].map(([question, answer], i) => ({ siteId, question, answer, sortOrder: i })),
  );

  await db.insert(s.caseStudies).values([
    { siteId, title: "Check Engine Light. No Guesswork.", problem: "An intermittent check engine light that other shops couldn't pin down.", diagnosis: "Testing traced it to a failing ignition coil.", fix: "Replaced the coil only, with no unnecessary parts.", sortOrder: 0 },
    { siteId, title: "Suspension Noise Traced and Fixed.", problem: "A clunk over every bump.", diagnosis: "Worn control arm bushings.", fix: "Replaced the bushings and verified on a road test.", sortOrder: 1 },
    { siteId, title: "No-Start Diagnosed Correctly.", problem: "An intermittent no-start.", diagnosis: "A failing starter, confirmed by testing rather than guesswork.", fix: "Replaced the starter; no extra parts thrown at the problem.", sortOrder: 2 },
  ]);

  await db.insert(s.integrations).values([
    { siteId, type: "tire_finder", config: { url: "", label: "GUS Tire Finder" }, enabled: true },
    { siteId, type: "ai_diagnostic", config: { url: "", label: "AI diagnostic tool" }, enabled: true },
  ]);

  // ---------- menus ----------
  await db.insert(s.menus).values([
    {
      siteId,
      location: "header",
      items: [
        { label: "Home", href: "/" },
        { label: "About Us", href: "/about-us/" },
        { label: "Diagnostics", href: "/diagnostics/" },
        { label: "Tires", href: "/tires/" },
        {
          label: "Services",
          href: "/services/",
          children: svc.slice(0, 8).map(([slug, name]) => ({ label: name, href: `/${slug}/` })),
        },
        { label: "Specials", href: "/specials/" },
        { label: "Testimonials", href: "/testimonials/" },
        { label: "Contact", href: "/make-an-appointment/" },
      ],
    },
    {
      siteId,
      location: "footer",
      items: [
        { label: "Brake Repairs", href: "/brake-repair-safety-checks/" },
        { label: "Preventative Maintenance", href: "/preventative-maintenance/" },
        { label: "Emissions Failure Repair", href: "/exhaust-emissions/" },
        { label: "Tire Services", href: "/tire-services-alignment/" },
        { label: "FAQ", href: "/faq/" },
        { label: "Terms & Conditions", href: "/terms-conditions/" },
        { label: "Privacy Policy", href: "/privacy-policy/" },
      ],
    },
  ]);

  // ---------- redirects for old WordPress post IDs ----------
  await db.insert(s.redirects).values([
    { siteId, fromPath: "/?p=10568", toPath: "/brake-repair-safety-checks/" },
    { siteId, fromPath: "/?p=10585", toPath: "/preventative-maintenance/" },
    { siteId, fromPath: "/?p=10626", toPath: "/exhaust-emissions/" },
    { siteId, fromPath: "/?p=10629", toPath: "/tire-services-alignment/" },
    { siteId, fromPath: "/terms-conditions", toPath: "/terms-conditions/" },
    { siteId, fromPath: "/privacy-policy", toPath: "/privacy-policy/" },
  ]);

  // ---------- pages + sections ----------
  type Sec = [BlockType, Record<string, unknown>];
  const pageDefs: Array<{ slug: string; title: string; seoTitle: string; seoDescription: string; showInNav?: boolean; sections: Sec[] }> = [
    {
      slug: "",
      title: "Home",
      seoTitle: "Mick's Repair | Auto Repair Shop in Worthington MN",
      seoDescription: "Family-owned auto repair in Worthington, MN: diagnostics, brakes, engine, oil changes and tires, with free pickup and delivery.",
      sections: [
        ["hero", { heading: "HOMETOWN TRUST\nADVANCED EXPERTISE\nPICKUP - REPAIR - RETURN", subheading: "Honest answers. Modern diagnostics. And free pickup and delivery that saves you time.", primaryCta: { label: "Schedule Service", href: "/make-an-appointment/#book" }, secondaryCta: { label: "Start with a Diagnosis", href: "/diagnostics/" }, tertiaryCta: { label: "Find the Right Tires", href: "/tires/" }, reviewImageUrl: `${WP}/2026/04/reviews-google.webp`, certificationLogos: [`${WP}/2026/04/Group.svg`, `${WP}/2026/04/ase-seeklogo-1-1.svg`], imageUrl: `${WP}/2026/04/Micks-Repair-Worthington.webp`, showRating: true, badges: [] }],
        ["trust_cards", { items: [
          { title: "Local trust that’s earned", body: "We’ve built our reputation one customer at a time. When you bring your vehicle to Mick’s, you’re working with people who care about doing it right and standing behind their work." },
          { title: "Advanced diagnostics. Accurate repairs.", body: "Today’s vehicles are complex. We use modern diagnostic tools and proven repair methods to identify the real problem, so you’re not paying for guesswork." },
          { title: "We work around your schedule", body: "Auto repair shouldn’t disrupt your day. We offer free pickup and delivery, clear communication, and a process designed to save you time." },
          { title: "Clear answers. No pressure.", body: "We explain what’s going on, what your options are, and what actually needs to be done. No upselling. No confusion. Just straightforward guidance." },
        ], closingText: "We diagnose it clearly, explain it simply.\nWe treat every repair like we’re spending our own money." }],
        ["about", { heading: "Straight answers. Expert guidance. Repairs you can trust.", body: "At Mick’s Repair, we’ve built our reputation by doing things the right way. For over 35 years, local families in Worthington have trusted us to diagnose issues accurately, explain what’s going on in plain language, and make sure every repair is done right the first time.\n\nToday, Mick’s is run by Mick Eggers and his two sons, Kelly and Terry, carrying forward the same commitment to honest work and doing things the right way. No pressure. No unnecessary repairs. Just straightforward recommendations you can trust.\n\nWe know your time matters. That’s why we offer free pickup and delivery, making it easier to get your vehicle serviced without disrupting your day.", imageUrl: `${WP}/2026/04/mick-eggers.webp`, highlights: ["35+ years in Worthington", "Family owned and operated", "You approve every line of the quote"] }],
        ["services_grid", { heading: "Auto repair services", subheading: "From routine maintenance to complex diagnostics.", limit: 8 }],
        ["embed", { heading: "Confused about your vehicle problem? Our AI tool can help.", body: "Run a free check before you visit and get $25 off the diagnostic fee.", integration: "ai_diagnostic", height: 600 }],
        ["case_studies", { heading: "Real problems. Real fixes." }],
        ["reviews", { heading: "What Worthington drivers say", limit: 6 }],
        ["specials", { heading: "Current specials" }],
        ["contact_map", { heading: "Visit the shop" }],
        ["booking_form", { heading: "Schedule service", subheading: "Pick a day and time; we'll confirm by your preferred contact method." }],
      ],
    },
    {
      slug: "about-us",
      title: "About Us",
      seoTitle: "About Us: Your Family's Tire and Repair Experts - Mick's Repair",
      seoDescription: "Mick's Repair in Worthington, MN: family-owned auto repair, diagnostics and maintenance for over 35 years.",
      sections: [
        ["hero", { heading: "About Mick's Repair", subheading: "Family owned in downtown Worthington for over 35 years.", showRating: true, badges: [] }],
        ["about", { heading: "Run by Mick Eggers and his sons, Kelly and Terry", body: "We focus on accurate diagnosis, plain-language explanations and repairs done right the first time. No pressure and no unnecessary work.\n\nYou approve every line of your quote before we start. Our ASE-certified technicians use factory-level diagnostic tools, and we aim for same-day turnaround on most jobs.\n\nEvery qualifying repair is backed by a 12-month/12,000-mile nationwide warranty, and pickup and delivery is always free in town.", highlights: ["ASE-certified technicians", "Factory-level diagnostics", "Same-day turnaround on most jobs", "Free pickup and delivery"] }],
        ["reviews", { heading: "Reviews", limit: 6 }],
        ["cta", { heading: "Ready when you are", body: "Book online or call the shop.", cta: { label: "Schedule Service", href: "/make-an-appointment/" }, variant: "dark" }],
      ],
    },
    {
      slug: "services",
      title: "Services",
      seoTitle: "Auto Repair Services - Mick's Repair - Worthington MN",
      seoDescription: "Diagnostics, brakes, oil changes, engine, transmission, suspension, A/C, electrical and tire services in Worthington, MN.",
      sections: [
        ["hero", { heading: "Auto repair services", subheading: "Routine upkeep through complex repairs, all under one roof.", showRating: false, badges: [] }],
        ["services_grid", { heading: "Everything we do" }],
        ["cta", { heading: "Not sure what you need?", body: "Start with a diagnosis. We'll explain what we find before any work begins.", cta: { label: "Schedule a diagnosis", href: "/make-an-appointment/" }, variant: "primary" }],
      ],
    },
    {
      slug: "diagnostics",
      title: "Diagnostics",
      seoTitle: "Vehicle Diagnostics in Worthington, MN | Mick's Repair",
      seoDescription: "Check engine light, no-start and intermittent problem diagnosis with factory-level tools. Free pickup and delivery.",
      sections: [
        ["hero", { heading: "Start with a diagnosis", subheading: "We find the real problem before replacing anything.", primaryCta: { label: "Book a diagnosis", href: "/make-an-appointment/" }, showRating: true, badges: [] }],
        ["embed", { heading: "Try our AI diagnostic tool first", body: "Describe the symptoms and get a head start, plus $25 off the diagnostic fee.", integration: "ai_diagnostic", height: 700 }],
        ["case_studies", { heading: "Recent diagnoses" }],
        ["booking_form", { heading: "Book a diagnosis" }],
      ],
    },
    {
      slug: "tires",
      title: "Tires",
      seoTitle: "Tires & Alignment in Worthington, MN | Mick's Repair",
      seoDescription: "Find the right tires for your vehicle and driving, plus rotation, balancing and precision alignment.",
      sections: [
        ["hero", { heading: "The right tire, for your vehicle, backed by real experts.", subheading: "Recommendations based on your vehicle, how you drive and what matters to you.", primaryCta: { label: "Find my tires", href: "#tire-finder" }, showRating: false, badges: [] }],
        ["embed", { heading: "Find my tires", integration: "tire_finder", height: 800 }],
        ["specials", { heading: "Tire and alignment specials" }],
      ],
    },
    {
      slug: "specials",
      title: "Specials",
      seoTitle: "Specials - discount deals - Mick's Repair - Worthington MN",
      seoDescription: "Current auto repair specials at Mick's Repair in Worthington, MN: oil changes, alignment and service packages.",
      sections: [
        ["hero", { heading: "Current specials", subheading: "Mention the code when you book.", showRating: false, badges: [] }],
        ["specials", { heading: "This month's deals" }],
        ["booking_form", { heading: "Book your special" }],
      ],
    },
    {
      slug: "testimonials",
      title: "Testimonials",
      seoTitle: "Customer Reviews | Mick's Repair Worthington MN",
      seoDescription: "Read what Worthington drivers say about Mick's Repair.",
      sections: [
        ["hero", { heading: "What our customers say", showRating: true, badges: [] }],
        ["reviews", { heading: "Reviews", limit: 30 }],
      ],
    },
    {
      slug: "faq",
      title: "FAQ",
      showInNav: false,
      seoTitle: "FAQs: Your Family's Tire and Repair Experts - Mick's Repair",
      seoDescription: "Answers to common questions about appointments, maintenance, brakes, diagnostics and warranties at Mick's Repair.",
      sections: [["faq", { heading: "Frequently asked questions" }], ["contact_map", { heading: "Still have questions? Call or visit." }]],
    },
    {
      slug: "make-an-appointment",
      title: "Contact",
      seoTitle: "Make an Appointment | Mick's Repair Worthington MN",
      seoDescription: "Schedule auto repair at Mick's Repair in Worthington, MN. Online booking, free pickup and delivery.",
      sections: [
        ["booking_form", { heading: "Make an appointment", subheading: "Tell us about your vehicle and pick a time. We'll confirm shortly." }],
        ["contact_map", { heading: "Contact & directions" }],
      ],
    },
    {
      slug: "terms-conditions",
      title: "Terms & Conditions",
      showInNav: false,
      seoTitle: "Terms & Conditions | Mick's Repair",
      seoDescription: "Terms and conditions for Mick's Repair.",
      sections: [["rich_text", { heading: "Terms & Conditions", body: "Replace this placeholder with the current terms from the WordPress site before launch." }]],
    },
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      showInNav: false,
      seoTitle: "Privacy Policy | Mick's Repair",
      seoDescription: "Privacy policy for Mick's Repair.",
      sections: [["rich_text", { heading: "Privacy Policy", body: "Replace this placeholder with the current privacy policy from the WordPress site before launch." }]],
    },
  ];

  for (const [i, p] of pageDefs.entries()) {
    const pageId = crypto.randomUUID();
    await db.insert(s.pages).values({ id: pageId, siteId, slug: p.slug, title: p.title, seoTitle: p.seoTitle, seoDescription: p.seoDescription, sortOrder: i, showInNav: p.showInNav ?? true, status: "PUBLISHED" });
    await db.insert(s.pageSections).values(p.sections.map(([type, props], j) => ({ siteId, pageId, type, props, sortOrder: j })));
  }

  await db.insert(s.siteMembers).values({ siteId, userId: adminId!, role: "OWNER" });
  await db.insert(s.auditLog).values({ userId: adminId, siteId, action: "site.seed", detail: { source: "micksrepair.com" } });

  console.log(`Seeded Mick's Repair (${siteId}). Local preview: http://${SLUG}.localhost:3000`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(closeDb);
