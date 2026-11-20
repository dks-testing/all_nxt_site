import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { closeDb, getDb } from "../src/client";
import * as s from "../src/schema";

const requiredPages = ["about-us", "services", "specials", "testimonials", "make-an-appointment"];

async function main() {
  const db = getDb();
  const [site] = await db.select({ id: s.sites.id }).from(s.sites).where(eq(s.sites.slug, "micks-repair"));
  if (!site) throw new Error("Missing micks-repair site");
  const pages = await db.select({ id: s.pages.id, slug: s.pages.slug }).from(s.pages)
    .where(and(eq(s.pages.siteId, site.id), inArray(s.pages.slug, requiredPages)));
  if (pages.length !== requiredPages.length) throw new Error(`Expected ${requiredPages.length} template pages, found ${pages.length}`);

  const sections = await db.select({ pageId: s.pageSections.pageId, type: s.pageSections.type, props: s.pageSections.props }).from(s.pageSections)
    .where(and(eq(s.pageSections.siteId, site.id), inArray(s.pageSections.pageId, pages.map((page) => page.id)), eq(s.pageSections.isVisible, true)));
  const requiredSections: Record<string, string[]> = {
    "about-us": ["hero", "about_intro", "about_mission", "about_work", "about_owner", "team_gallery", "about_cta"], services: ["hero", "services_grid"], specials: ["hero", "specials"],
    testimonials: ["hero", "reviews"], "make-an-appointment": ["hero", "booking_form"],
  };
  for (const page of pages) {
    const types = new Set(sections.filter((section) => section.pageId === page.id).map((section) => section.type));
    for (const type of requiredSections[page.slug] ?? []) if (!types.has(type)) throw new Error(`Missing ${page.slug}/${type} section`);
  }
  const propsFor = (slug: string, type: string) => {
    const page = pages.find((item) => item.slug === slug);
    return sections.find((section) => section.pageId === page?.id && section.type === type)?.props ?? {};
  };
  const intro = propsFor("about-us", "about_intro");
  const mission = propsFor("about-us", "about_mission");
  const work = propsFor("about-us", "about_work");
  const owner = propsFor("about-us", "about_owner");
  const team = propsFor("about-us", "team_gallery");
  const aboutCta = propsFor("about-us", "about_cta");
  if (!intro.heading || !intro.body || !mission.heading || !Array.isArray(work.items) || !work.items.length || !owner.body || !Array.isArray(team.teamMemberIds) || !team.teamMemberIds.length || !aboutCta.heading) throw new Error("Split About template content is incomplete");
  const serviceGrid = propsFor("services", "services_grid");
  if (!serviceGrid.heading || !serviceGrid.subheading) throw new Error("Services index template content is incomplete");
  const specials = propsFor("specials", "specials");
  if (!specials.heading || !specials.subheading) throw new Error("Specials template content is incomplete");
  const booking = propsFor("make-an-appointment", "booking_form");
  if (!booking.heading || !booking.subheading) throw new Error("Appointment template content is incomplete");

  const services = await db.select({ id: s.services.id, imageUrl: s.services.imageUrl, processSteps: s.services.processSteps, trustItems: s.services.trustItems, finalCtaLabel: s.services.finalCtaLabel, finalCtaHref: s.services.finalCtaHref }).from(s.services)
    .where(and(eq(s.services.siteId, site.id), eq(s.services.isActive, true), isNotNull(s.services.processHeading), isNotNull(s.services.trustHeading), isNotNull(s.services.finalHeading)));
  const allServices = await db.select({ id: s.services.id }).from(s.services).where(and(eq(s.services.siteId, site.id), eq(s.services.isActive, true)));
  if (services.length !== allServices.length) throw new Error(`Only ${services.length}/${allServices.length} active services have dynamic template content`);
  if (services.some((service) => !service.imageUrl || !service.processSteps?.length || !service.trustItems?.length || !service.finalCtaLabel || !service.finalCtaHref)) throw new Error("One or more service templates have incomplete persisted content or imagery");

  const [theme] = await db.select({ design: s.themes.design }).from(s.themes).where(eq(s.themes.siteId, site.id));
  if (!theme?.design?.scheduleCtaLabel || !theme.design.diagnosticsCtaLabel || !theme.design.tiresCtaLabel || !theme.design.aboutCtaLabel || !theme.design.servicesCtaLabel || !theme.design.serviceCardCtaLabel || !theme.design.callCtaLabel) throw new Error("Missing global CTA labels");
  console.log(JSON.stringify({ siteId: site.id, templatePages: pages.length, persistedSections: sections.length, dynamicServices: services.length, globalCtaLabels: 7 }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(closeDb);
