import { eq, inArray } from "drizzle-orm";
import { getDb } from "./client";
import * as s from "./schema";

/** Tables keyed by site_id that are deleted with a site. */
const siteTables = [
  s.domains, s.locations, s.pages, s.pageSections, s.banners, s.services, s.specials, s.testimonials, s.faqs,
  s.caseStudies, s.menus, s.integrations, s.appointments, s.formSubmissions, s.media, s.redirects, s.siteMembers,
  s.siteVersions,
] as const;

export async function snapshotSite(siteId: string) {
  const db = getDb();
  const one = async (table: any) => (await db.select().from(table).where(eq(table.siteId, siteId)))[0] ?? null;
  const many = (table: any) => db.select().from(table).where(eq(table.siteId, siteId));
  return {
    settings: await one(s.siteSettings),
    theme: await one(s.themes),
    booking: await one(s.bookingSettings),
    pages: await many(s.pages),
    sections: await many(s.pageSections),
    services: await many(s.services),
    specials: await many(s.specials),
    faqs: await many(s.faqs),
    caseStudies: await many(s.caseStudies),
    banners: await many(s.banners),
    menus: await many(s.menus),
    locations: await many(s.locations),
  };
}

export async function setSiteStatus(siteId: string, status: s.SiteStatus, userId?: string | null, note?: string) {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(s.sites)
      .set({ status, ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {}) })
      .where(eq(s.sites.id, siteId));
    await tx.insert(s.auditLog).values({ userId: userId ?? null, siteId, action: `site.${status.toLowerCase()}`, detail: note ? { note } : null });
  });
  if (status === "PUBLISHED") {
    await db.insert(s.siteVersions).values({ siteId, snapshot: await snapshotSite(siteId), note: note ?? "Published", createdBy: userId ?? null });
  }
}

/** Restores content tables from a stored version (settings, theme, pages, sections, collections). */
export async function restoreVersion(siteId: string, versionId: string, userId?: string | null) {
  const db = getDb();
  const [v] = await db.select().from(s.siteVersions).where(eq(s.siteVersions.id, versionId)).limit(1);
  if (!v || v.siteId !== siteId) throw new Error("Version not found");
  const snap = v.snapshot as any;
  await db.transaction(async (tx) => {
    const fix = (rows: any[]) => rows.map((r) => {
      const o: any = { ...r };
      for (const k of ["updatedAt", "createdAt", "startsAt", "endsAt"]) if (o[k]) o[k] = new Date(o[k]);
      return o;
    });
    const replaceMany = async (table: any, rows: any[]) => {
      await tx.delete(table).where(eq(table.siteId, siteId));
      if (rows?.length) await tx.insert(table).values(fix(rows));
    };
    const replaceOne = async (table: any, row: any) => {
      await tx.delete(table).where(eq(table.siteId, siteId));
      if (row) await tx.insert(table).values(fix([row])[0]);
    };
    await replaceOne(s.siteSettings, snap.settings);
    await replaceOne(s.themes, snap.theme);
    await replaceOne(s.bookingSettings, snap.booking);
    await replaceMany(s.pages, snap.pages);
    await replaceMany(s.pageSections, snap.sections);
    await replaceMany(s.services, snap.services);
    await replaceMany(s.specials, snap.specials);
    await replaceMany(s.faqs, snap.faqs);
    await replaceMany(s.caseStudies, snap.caseStudies);
    await replaceMany(s.banners, snap.banners);
    await replaceMany(s.menus, snap.menus);
    await replaceMany(s.locations, snap.locations);
    await tx.insert(s.auditLog).values({ userId: userId ?? null, siteId, action: "site.restore", detail: { versionId } });
  });
}

export async function deleteSite(siteId: string, userId?: string | null) {
  const db = getDb();
  await db.transaction(async (tx) => {
    for (const t of siteTables) await tx.delete(t).where(eq((t as any).siteId, siteId));
    await tx.delete(s.siteSettings).where(eq(s.siteSettings.siteId, siteId));
    await tx.delete(s.themes).where(eq(s.themes.siteId, siteId));
    await tx.delete(s.bookingSettings).where(eq(s.bookingSettings.siteId, siteId));
    await tx.delete(s.sites).where(eq(s.sites.id, siteId));
    await tx.insert(s.auditLog).values({ userId: userId ?? null, siteId, action: "site.delete" });
  });
}

export async function audit(userId: string | null | undefined, siteId: string | null, action: string, detail?: Record<string, unknown>) {
  await getDb().insert(s.auditLog).values({ userId: userId ?? null, siteId, action, detail: detail ?? null });
}

export { inArray };
