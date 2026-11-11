import { eq } from "drizzle-orm";
import { getDb } from "./client";
import * as s from "./schema";

export type CloneOptions = {
  sourceSiteId: string;
  name: string;
  slug: string;
  createdBy?: string | null;
  /** Copy testimonials too (default false: reviews belong to the original business). */
  includeTestimonials?: boolean;
  /** Overrides applied to the cloned settings (e.g. new business name / phone). */
  settingsOverrides?: Partial<typeof s.siteSettings.$inferInsert>;
};

const newId = () => crypto.randomUUID();

/**
 * Deep-copies a site in one transaction.
 * Copied: settings, theme, locations, pages + sections, banners, services, specials, faqs,
 *         case studies, menus, integrations (disabled analytics), booking settings, redirects.
 * NOT copied: domains, appointments, form submissions, members, audit log, versions,
 *             testimonials (unless includeTestimonials).
 */
export async function cloneSite(opts: CloneOptions) {
  const db = getDb();
  const slug = slugify(opts.slug);
  if (!slug) throw new Error("Slug is required");

  return db.transaction(async (tx) => {
    const [source] = await tx.select().from(s.sites).where(eq(s.sites.id, opts.sourceSiteId)).limit(1);
    if (!source) throw new Error("Source site not found");
    const [clash] = await tx.select({ id: s.sites.id }).from(s.sites).where(eq(s.sites.slug, slug)).limit(1);
    if (clash) throw new Error(`A site with slug "${slug}" already exists`);

    const siteId = newId();
    await tx.insert(s.sites).values({
      id: siteId,
      name: opts.name,
      slug,
      status: "DRAFT",
      isTemplate: false,
      clonedFromId: source.id,
      createdBy: opts.createdBy ?? null,
    });

    const sid = opts.sourceSiteId;

    const [settings] = await tx.select().from(s.siteSettings).where(eq(s.siteSettings.siteId, sid));
    if (settings) {
      const { updatedAt: _u, ...rest } = settings;
      await tx.insert(s.siteSettings).values({ ...rest, siteId, businessName: opts.name, ratingValue: null, ratingCount: null, googlePlaceId: null, ...opts.settingsOverrides });
    } else {
      await tx.insert(s.siteSettings).values({ siteId, businessName: opts.name, ...opts.settingsOverrides });
    }

    const [theme] = await tx.select().from(s.themes).where(eq(s.themes.siteId, sid));
    if (theme) {
      const { updatedAt: _u, ...rest } = theme;
      await tx.insert(s.themes).values({ ...rest, siteId });
    }

    const [booking] = await tx.select().from(s.bookingSettings).where(eq(s.bookingSettings.siteId, sid));
    if (booking) await tx.insert(s.bookingSettings).values({ ...booking, siteId, notifyEmails: [], notifySms: [] });

    // Pages need an id map so sections and parent links follow.
    const pageRows = await tx.select().from(s.pages).where(eq(s.pages.siteId, sid));
    const pageMap = new Map(pageRows.map((p) => [p.id, newId()]));
    if (pageRows.length) {
      await tx.insert(s.pages).values(
        pageRows.map(({ updatedAt: _u, ...p }) => ({
          ...p,
          id: pageMap.get(p.id)!,
          siteId,
          parentId: p.parentId ? pageMap.get(p.parentId) ?? null : null,
        })),
      );
    }
    const sectionRows = await tx.select().from(s.pageSections).where(eq(s.pageSections.siteId, sid));
    const liveSections = sectionRows.filter((x) => pageMap.has(x.pageId));
    if (liveSections.length) {
      await tx.insert(s.pageSections).values(liveSections.map((x) => ({ ...x, id: newId(), siteId, pageId: pageMap.get(x.pageId)! })));
    }

    // Simple collections: copy with a fresh id + new siteId.
    const copy = async <T extends { id: string; siteId: string }>(table: any, rows: T[], map?: (r: T) => Partial<T>) => {
      if (!rows.length) return 0;
      await tx.insert(table).values(rows.map((r) => ({ ...r, ...(map ? map(r) : {}), id: newId(), siteId })));
      return rows.length;
    };

    await copy(s.locations, await tx.select().from(s.locations).where(eq(s.locations.siteId, sid)));
    await copy(s.banners, await tx.select().from(s.banners).where(eq(s.banners.siteId, sid)));
    await copy(s.services, await tx.select().from(s.services).where(eq(s.services.siteId, sid)));
    await copy(s.specials, await tx.select().from(s.specials).where(eq(s.specials.siteId, sid)));
    await copy(s.faqs, await tx.select().from(s.faqs).where(eq(s.faqs.siteId, sid)));
    await copy(s.caseStudies, await tx.select().from(s.caseStudies).where(eq(s.caseStudies.siteId, sid)));
    await copy(s.menus, await tx.select().from(s.menus).where(eq(s.menus.siteId, sid)));
    await copy(s.redirects, await tx.select().from(s.redirects).where(eq(s.redirects.siteId, sid)));
    await copy(s.media, await tx.select().from(s.media).where(eq(s.media.siteId, sid)), () => ({ createdAt: undefined as any }));
    // Analytics IDs belong to the original business, so they're copied disabled.
    await copy(s.integrations, await tx.select().from(s.integrations).where(eq(s.integrations.siteId, sid)), (r) => ({
      enabled: ["ga4", "gtm", "meta_pixel"].includes(r.type) ? false : r.enabled,
    }));
    if (opts.includeTestimonials) {
      await copy(s.testimonials, await tx.select().from(s.testimonials).where(eq(s.testimonials.siteId, sid)));
    }

    await tx.insert(s.auditLog).values({
      userId: opts.createdBy ?? null,
      siteId,
      action: "site.clone",
      detail: { from: sid, fromName: source.name, pages: pageRows.length, sections: liveSections.length },
    });

    return { siteId, slug };
  });
}

/** Refreshes page sections in an existing clone from its source template without touching business data, branding, collections or SEO. */
export async function syncCloneSections(siteId: string) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [target] = await tx.select().from(s.sites).where(eq(s.sites.id, siteId)).limit(1);
    if (!target?.clonedFromId) throw new Error("This site was not created from a template");
    const sourcePages = await tx.select().from(s.pages).where(eq(s.pages.siteId, target.clonedFromId));
    const targetPages = await tx.select().from(s.pages).where(eq(s.pages.siteId, siteId));
    let pagesAdded = 0, sectionsCopied = 0;
    for (const sourcePage of sourcePages) {
      const existingTargetPage = targetPages.find((page) => page.slug === sourcePage.slug);
      let targetPageId = existingTargetPage?.id;
      if (!targetPageId) {
        const { updatedAt: _updatedAt, ...copy } = sourcePage;
        targetPageId = newId();
        await tx.insert(s.pages).values({ ...copy, id: targetPageId, siteId, parentId: null });
        pagesAdded++;
      }
      const sourceSections = await tx.select().from(s.pageSections).where(eq(s.pageSections.pageId, sourcePage.id));
      await tx.delete(s.pageSections).where(eq(s.pageSections.pageId, targetPageId));
      if (sourceSections.length) {
        await tx.insert(s.pageSections).values(sourceSections.map((section) => ({ ...section, id: newId(), siteId, pageId: targetPageId })));
        sectionsCopied += sourceSections.length;
      }
    }
    return { pagesAdded, sectionsCopied };
  });
}

export function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
