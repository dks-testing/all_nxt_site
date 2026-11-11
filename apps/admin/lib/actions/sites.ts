"use server";
import { revalidatePath } from "next/cache";
import {
  getDb, sites, siteSettings, themes, pages, pageSections, menus, bookingSettings, siteMembers, eq,
  cloneSite, syncCloneSections, slugify, setSiteStatus, deleteSite as dbDeleteSite, restoreVersion, audit,
} from "@platform/db";
import { defaultColors, defaultFonts } from "@platform/db/theme";
import { requireUser, requireSiteAccess } from "../auth";
import { revalidateSite } from "../revalidate";
import { str } from "../forms";
import { run } from "./run";

export async function createSite(fd: FormData) {
  const user = await requireUser();
  const name = str(fd, "name");
  const slug = slugify(str(fd, "slug") || name);
  const source = str(fd, "source");
  return run("/sites/new", async () => {
    if (!name) throw new Error("Name is required");
    if (user.globalRole !== "SUPER_ADMIN") throw new Error("Only super-admins can create sites");
    let siteId: string;
    if (source && source !== "blank") {
      ({ siteId } = await cloneSite({ sourceSiteId: source, name, slug, createdBy: user.id }));
    } else {
      siteId = await createBlankSite(name, slug, user.id);
    }
    await getDb().insert(siteMembers).values({ siteId, userId: user.id, role: "OWNER" });
    revalidatePath("/");
    return { ok: source && source !== "blank" ? "Site cloned as a draft" : "Site created as a draft", to: `/sites/${siteId}` };
  });
}

async function createBlankSite(name: string, slug: string, userId: string) {
  const db = getDb();
  if (!slug) throw new Error("Slug is required");
  const [clash] = await db.select({ id: sites.id }).from(sites).where(eq(sites.slug, slug));
  if (clash) throw new Error(`A site with slug "${slug}" already exists`);
  const siteId = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(sites).values({ id: siteId, name, slug, status: "DRAFT", createdBy: userId });
    await tx.insert(siteSettings).values({ siteId, businessName: name, hours: [] });
    await tx.insert(themes).values({ siteId, colors: defaultColors, fonts: defaultFonts });
    await tx.insert(bookingSettings).values({ siteId, closedDays: [0, 6], notifyEmails: [], notifySms: [] });
    await tx.insert(menus).values([
      { siteId, location: "header", items: [{ label: "Home", href: "/" }, { label: "Services", href: "/services/" }, { label: "Contact", href: "/contact/" }] },
      { siteId, location: "footer", items: [] },
    ]);
    const home = crypto.randomUUID(), svc = crypto.randomUUID(), contact = crypto.randomUUID();
    await tx.insert(pages).values([
      { id: home, siteId, slug: "", title: "Home", sortOrder: 0 },
      { id: svc, siteId, slug: "services", title: "Services", sortOrder: 1 },
      { id: contact, siteId, slug: "contact", title: "Contact", sortOrder: 2 },
    ]);
    await tx.insert(pageSections).values([
      { siteId, pageId: home, type: "hero", sortOrder: 0, props: { heading: `Welcome to ${name}`, subheading: "Edit this text in the admin.", primaryCta: { label: "Contact us", href: "/contact/" }, showRating: false, badges: [] } },
      { siteId, pageId: home, type: "services_grid", sortOrder: 1, props: { heading: "Our services" } },
      { siteId, pageId: home, type: "contact_map", sortOrder: 2, props: { heading: "Visit us" } },
      { siteId, pageId: svc, type: "services_grid", sortOrder: 0, props: { heading: "Our services" } },
      { siteId, pageId: contact, type: "booking_form", sortOrder: 0, props: { heading: "Get in touch" } },
      { siteId, pageId: contact, type: "contact_map", sortOrder: 1, props: { heading: "Find us" } },
    ]);
  });
  await audit(userId, siteId, "site.create");
  return siteId;
}

export async function cloneSiteAction(fd: FormData) {
  const sourceId = str(fd, "sourceId");
  const { user } = await requireSiteAccess(sourceId, "VIEWER");
  const name = str(fd, "name");
  return run(`/`, async () => {
    if (user.globalRole !== "SUPER_ADMIN") throw new Error("Only super-admins can clone sites");
    if (!name) throw new Error("Name is required");
    const { siteId } = await cloneSite({ sourceSiteId: sourceId, name, slug: str(fd, "slug") || name, createdBy: user.id, includeTestimonials: fd.get("includeTestimonials") === "on" });
    await getDb().insert(siteMembers).values({ siteId, userId: user.id, role: "OWNER" });
    revalidatePath("/");
    return { ok: `Cloned to "${name}" (draft)`, to: `/sites/${siteId}` };
  });
}

export async function syncCloneSectionsAction(fd: FormData) {
  const siteId = str(fd, "siteId");
  const { user } = await requireSiteAccess(siteId, "OWNER");
  return run(`/sites/${siteId}`, async () => {
    const result = await syncCloneSections(siteId);
    await audit(user.id, siteId, "site.template_sections_sync", result);
    await revalidateSite(siteId);
    revalidatePath(`/sites/${siteId}`, "layout");
    return `Template updated: ${result.sectionsCopied} sections copied${result.pagesAdded ? ` and ${result.pagesAdded} pages added` : ""}`;
  });
}

export async function setStatus(fd: FormData) {
  const siteId = str(fd, "siteId");
  const status = str(fd, "status") as "PUBLISHED" | "UNPUBLISHED" | "ARCHIVED" | "DRAFT";
  const back = str(fd, "back") || `/sites/${siteId}`;
  const { user } = await requireSiteAccess(siteId, "OWNER");
  return run(back, async () => {
    if (!["PUBLISHED", "UNPUBLISHED", "ARCHIVED", "DRAFT"].includes(status)) throw new Error("Bad status");
    await setSiteStatus(siteId, status, user.id, str(fd, "note") || undefined);
    const r = await revalidateSite(siteId);
    revalidatePath("/");
    revalidatePath(`/sites/${siteId}`, "layout");
    const label = { PUBLISHED: "Published. Live within ~30 seconds", UNPUBLISHED: "Unpublished. Visitors now see a 'temporarily unavailable' page", ARCHIVED: "Archived", DRAFT: "Moved to draft" }[status];
    return r.ok ? label : `${label} (cache refresh failed: ${r.error})`;
  });
}

export async function deleteSiteAction(fd: FormData) {
  const siteId = str(fd, "siteId");
  const { user } = await requireSiteAccess(siteId, "OWNER");
  return run(`/sites/${siteId}`, async () => {
    if (user.globalRole !== "SUPER_ADMIN") throw new Error("Only super-admins can delete sites");
    const [s] = await getDb().select().from(sites).where(eq(sites.id, siteId));
    if (!s) throw new Error("Site not found");
    if (str(fd, "confirmSlug") !== s.slug) throw new Error(`Type "${s.slug}" to confirm deletion`);
    await dbDeleteSite(siteId, user.id);
    await revalidateSite(siteId);
    revalidatePath("/");
    return { ok: `Deleted "${s.name}"`, to: "/" };
  });
}

export async function restoreVersionAction(fd: FormData) {
  const siteId = str(fd, "siteId");
  const { user } = await requireSiteAccess(siteId, "OWNER");
  return run(`/sites/${siteId}`, async () => {
    await restoreVersion(siteId, str(fd, "versionId"), user.id);
    await revalidateSite(siteId);
    revalidatePath(`/sites/${siteId}`, "layout");
    return "Version restored";
  });
}
