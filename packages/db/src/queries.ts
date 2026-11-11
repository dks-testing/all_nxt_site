import { and, asc, eq, or, desc } from "drizzle-orm";
import { getDb } from "./client";
import * as s from "./schema";

/**
 * Read-side queries used by the public sites app.
 * EVERY query takes a siteId and filters by it: this is the tenant-isolation boundary.
 */

export type ResolvedSite = { siteId: string; slug: string; status: s.SiteStatus };

/** Resolve a site by its database slug (no DNS/domain required). */
export async function resolveSiteSlug(slug: string): Promise<ResolvedSite | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const [site] = await getDb()
    .select({ siteId: s.sites.id, slug: s.sites.slug, status: s.sites.status })
    .from(s.sites)
    .where(eq(s.sites.slug, slug))
    .limit(1);
  return site ?? null;
}

/** hostname -> site. Supports custom domains and `<slug>.<PLATFORM_ROOT_DOMAIN>` subdomains. */
export async function resolveHost(hostRaw: string, rootDomain = process.env.PLATFORM_ROOT_DOMAIN ?? ""): Promise<ResolvedSite | null> {
  const host = hostRaw.toLowerCase().trim();
  const db = getDb();

  // Local development needs no DNS, registered domains, or SSL.
  // localhost:3000 is the default site; <slug>.localhost:3000 resolves a clone.
  // This branch is deliberately disabled outside Next.js development mode.
  if (process.env.NODE_ENV === "development") {
    const hostname = host.replace(/:\d+$/, "");
    let localSlug: string | null = null;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      localSlug = process.env.LOCAL_DEFAULT_SITE_SLUG?.trim() || "micks-repair";
    } else if (hostname.endsWith(".localhost")) {
      localSlug = hostname.slice(0, -".localhost".length);
    }
    if (localSlug !== null) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(localSlug)) return null;
      const [localSite] = await db
        .select({ siteId: s.sites.id, slug: s.sites.slug, status: s.sites.status })
        .from(s.sites)
        .where(eq(s.sites.slug, localSlug))
        .limit(1);
      return localSite ?? null;
    }
  }

  const bare = host.startsWith("www.") ? host.slice(4) : host;
  const viaDomain = await db
    .select({ siteId: s.sites.id, slug: s.sites.slug, status: s.sites.status })
    .from(s.domains)
    .innerJoin(s.sites, eq(s.sites.id, s.domains.siteId))
    .where(or(eq(s.domains.hostname, host), eq(s.domains.hostname, bare)))
    .limit(1);
  if (viaDomain[0]) return viaDomain[0];

  const root = rootDomain.toLowerCase();
  if (root && host.endsWith(`.${root}`)) {
    const slug = host.slice(0, -(root.length + 1));
    if (slug && !slug.includes(".")) {
      const r = await db
        .select({ siteId: s.sites.id, slug: s.sites.slug, status: s.sites.status })
        .from(s.sites)
        .where(eq(s.sites.slug, slug))
        .limit(1);
      if (r[0]) return r[0];
    }
  }
  return null;
}

export async function getSiteBundle(siteId: string) {
  const db = getDb();
  const [site] = await db.select().from(s.sites).where(eq(s.sites.id, siteId)).limit(1);
  if (!site) return null;
  const [settings] = await db.select().from(s.siteSettings).where(eq(s.siteSettings.siteId, siteId)).limit(1);
  const [theme] = await db.select().from(s.themes).where(eq(s.themes.siteId, siteId)).limit(1);
  const menuRows = await db.select().from(s.menus).where(eq(s.menus.siteId, siteId));
  const integrationRows = await db
    .select()
    .from(s.integrations)
    .where(and(eq(s.integrations.siteId, siteId), eq(s.integrations.enabled, true)));
  const locationRows = await db
    .select()
    .from(s.locations)
    .where(eq(s.locations.siteId, siteId))
    .orderBy(desc(s.locations.isPrimary), asc(s.locations.name));
  const domainRows = await db.select().from(s.domains).where(eq(s.domains.siteId, siteId));
  const [booking] = await db.select().from(s.bookingSettings).where(eq(s.bookingSettings.siteId, siteId)).limit(1);
  return {
    site,
    settings: settings ?? null,
    theme: theme ?? null,
    headerMenu: menuRows.find((m) => m.location === "header")?.items ?? [],
    footerMenu: menuRows.find((m) => m.location === "footer")?.items ?? [],
    integrations: Object.fromEntries(integrationRows.map((i) => [i.type, i.config])) as Partial<Record<(typeof s.integrationTypes)[number], Record<string, string>>>,
    locations: locationRows,
    primaryDomain: domainRows.find((d) => d.isPrimary)?.hostname ?? domainRows[0]?.hostname ?? null,
    booking: booking ?? null,
  };
}
export type SiteBundle = NonNullable<Awaited<ReturnType<typeof getSiteBundle>>>;

export async function getPageBySlug(siteId: string, slug: string, opts: { includeDrafts?: boolean } = {}) {
  const db = getDb();
  const [page] = await db
    .select()
    .from(s.pages)
    .where(and(eq(s.pages.siteId, siteId), eq(s.pages.slug, slug)))
    .limit(1);
  if (!page || (page.status !== "PUBLISHED" && !opts.includeDrafts)) return null;
  const sections = await db
    .select()
    .from(s.pageSections)
    .where(and(eq(s.pageSections.siteId, siteId), eq(s.pageSections.pageId, page.id), eq(s.pageSections.isVisible, true)))
    .orderBy(asc(s.pageSections.sortOrder));
  return { page, sections };
}

export async function listPublishedPages(siteId: string) {
  return getDb()
    .select({ slug: s.pages.slug, title: s.pages.title, updatedAt: s.pages.updatedAt })
    .from(s.pages)
    .where(and(eq(s.pages.siteId, siteId), eq(s.pages.status, "PUBLISHED"), eq(s.pages.noIndex, false)))
    .orderBy(asc(s.pages.sortOrder));
}

export async function listServices(siteId: string) {
  return getDb()
    .select()
    .from(s.services)
    .where(and(eq(s.services.siteId, siteId), eq(s.services.isActive, true)))
    .orderBy(asc(s.services.sortOrder));
}

export async function getService(siteId: string, slug: string) {
  const [row] = await getDb()
    .select()
    .from(s.services)
    .where(and(eq(s.services.siteId, siteId), eq(s.services.slug, slug), eq(s.services.isActive, true)))
    .limit(1);
  return row ?? null;
}

export async function listSpecials(siteId: string) {
  return getDb()
    .select()
    .from(s.specials)
    .where(and(eq(s.specials.siteId, siteId), eq(s.specials.isActive, true)))
    .orderBy(asc(s.specials.sortOrder));
}

export async function listTestimonials(siteId: string) {
  return getDb()
    .select()
    .from(s.testimonials)
    .where(and(eq(s.testimonials.siteId, siteId), eq(s.testimonials.isActive, true)))
    .orderBy(asc(s.testimonials.sortOrder));
}

export async function listFaqs(siteId: string) {
  return getDb().select().from(s.faqs).where(eq(s.faqs.siteId, siteId)).orderBy(asc(s.faqs.sortOrder));
}

export async function listCaseStudies(siteId: string) {
  return getDb().select().from(s.caseStudies).where(eq(s.caseStudies.siteId, siteId)).orderBy(asc(s.caseStudies.sortOrder));
}

export async function getActiveBanner(siteId: string, placement: "hero" | "top_bar" | "promo") {
  const now = new Date();
  const rows = await getDb()
    .select()
    .from(s.banners)
    .where(and(eq(s.banners.siteId, siteId), eq(s.banners.placement, placement), eq(s.banners.isActive, true)))
    .orderBy(asc(s.banners.sortOrder));
  return rows.find((b) => (!b.startsAt || b.startsAt <= now) && (!b.endsAt || b.endsAt >= now)) ?? null;
}

export async function findRedirect(siteId: string, path: string) {
  const variants = Array.from(new Set([path, path.endsWith("/") ? path.slice(0, -1) : `${path}/`]));
  const rows = await getDb().select().from(s.redirects).where(eq(s.redirects.siteId, siteId));
  return rows.find((r) => variants.includes(r.fromPath)) ?? null;
}
