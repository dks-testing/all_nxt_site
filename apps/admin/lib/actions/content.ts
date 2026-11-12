"use server";
import bcrypt from "bcryptjs";
import { resolve4, resolveCname } from "node:dns/promises";
import { revalidatePath } from "next/cache";
import {
  getDb, and, eq, asc, siteSettings, themes, media, pages, pageSections, menus, domains, redirects, bookingSettings, appointments, services,
  integrations, users, siteMembers, integrationTypes, appointmentStatus, siteRoles, audit,
  type DayHours, type MenuItem, type ThemeColors,
} from "@platform/db";
import { blockSchemas, blockFields, defaultBlockProps, isBlockType, type Field } from "@platform/db/blocks";
import { fontOptions } from "@platform/db/theme";
import { fieldsSchema } from "@platform/db/booking-fields";
import { requireSiteAccess, requireSuperAdmin } from "../auth";
import { afterChange } from "../mutate";
import { collections, parseCollectionForm } from "../collections";
import { str, opt, bool, int, lines, emails } from "../forms";
import { run } from "./run";

const DAYS: DayHours["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ---------------- global site settings ---------------- */

export async function saveGlobalSettings(fd: FormData) {
  const siteId = str(fd, "siteId");
  const { user } = await requireSiteAccess(siteId);
  return run(`/sites/${siteId}/global`, async () => {
    const db = getDb();
    const businessName = str(fd, "businessName").trim() || "Untitled";
    const ownerName = str(fd, "ownerName").trim() || (/^Mick(?:'|’)?s Repair$/i.test(businessName) ? "Mick’s" : businessName);
    const scheduleCtaHref = str(fd, "scheduleCtaHref").trim() || "/make-an-appointment/";
    const diagnosticsCtaHref = str(fd, "diagnosticsCtaHref").trim() || "/diagnostics/";
    const tiresCtaHref = str(fd, "tiresCtaHref").trim() || "/tires/";
    const toolUrl = str(fd, "toolEmbedUrl").trim();
    const toolEnabled = bool(fd, "toolEnabled");

    const [settingsRow] = await db.select({ siteId: siteSettings.siteId }).from(siteSettings).where(eq(siteSettings.siteId, siteId));
    if (settingsRow) await db.update(siteSettings).set({ businessName, ownerName }).where(eq(siteSettings.siteId, siteId));
    else await db.insert(siteSettings).values({ siteId, businessName, ownerName, hours: [] });

    const [themeRow] = await db.select().from(themes).where(eq(themes.siteId, siteId));
    if (!themeRow) throw new Error("Set up branding before saving global links");
    await db.update(themes).set({
      design: { ...(themeRow.design ?? {}), scheduleCtaHref, diagnosticsCtaHref, tiresCtaHref },
    }).where(eq(themes.siteId, siteId));

    for (const type of ["tire_finder", "ai_diagnostic"] as const) {
      const config = { url: toolUrl, label: "Vehicle tool" };
      const [row] = await db.select().from(integrations).where(and(eq(integrations.siteId, siteId), eq(integrations.type, type)));
      if (row) await db.update(integrations).set({ config, enabled: toolEnabled }).where(eq(integrations.id, row.id));
      else if (toolUrl || toolEnabled) await db.insert(integrations).values({ siteId, type, config, enabled: toolEnabled });
    }

    await afterChange(siteId, user.id, "global-settings.update", { businessName, ownerName });
    return "Global settings saved across the entire site";
  });
}

/* ---------------- business info ---------------- */

export async function saveBusiness(fd: FormData) {
  const siteId = str(fd, "siteId");
  const { user } = await requireSiteAccess(siteId);
  return run(`/sites/${siteId}/business`, async () => {
    const hours: DayHours[] = DAYS.map((day) =>
      bool(fd, `closed_${day}`) ? { day, closed: true } : { day, open: str(fd, `open_${day}`) || "08:00", close: str(fd, `close_${day}`) || "17:00" },
    );
    const rating = str(fd, "ratingValue");
    const values = {
      businessName: str(fd, "businessName") || "Untitled",
      tagline: opt(fd, "tagline"),
      phone: opt(fd, "phone"),
      email: opt(fd, "email"),
      address: { street: str(fd, "street"), city: str(fd, "city"), region: str(fd, "region"), postalCode: str(fd, "postalCode"), country: str(fd, "country") || "US" },
      hours,
      social: Object.fromEntries(["facebook", "instagram", "google", "yelp", "youtube", "x"].map((k) => [k, str(fd, `social_${k}`)]).filter(([, v]) => v)),
      googlePlaceId: opt(fd, "googlePlaceId"),
      ratingValue: rating && !Number.isNaN(Number(rating)) ? Number(rating).toFixed(1) : null,
      ratingCount: str(fd, "ratingCount") ? int(fd, "ratingCount") : null,
      businessType: str(fd, "businessType") || "LocalBusiness",
      serviceArea: opt(fd, "serviceArea"),
      footerNote: opt(fd, "footerNote"),
    };
    const db = getDb();
    const [exists] = await db.select({ id: siteSettings.siteId }).from(siteSettings).where(eq(siteSettings.siteId, siteId));
    if (exists) await db.update(siteSettings).set(values).where(eq(siteSettings.siteId, siteId));
    else await db.insert(siteSettings).values({ siteId, ...values });
    await afterChange(siteId, user.id, "settings.update");
    return "Business info saved";
  });
}

/* ---------------- branding / theme ---------------- */

export async function saveTheme(fd: FormData) {
  const siteId = str(fd, "siteId");
  const { user } = await requireSiteAccess(siteId);
  return run(`/sites/${siteId}/branding`, async () => {
    const hex = (k: string) => {
      const v = str(fd, k);
      if (!/^#[0-9a-fA-F]{6}$/.test(v)) throw new Error(`${k} must be a hex colour like #1d4ed8`);
      return v;
    };
    const colors: ThemeColors = {
      primary: hex("primary"), primaryForeground: hex("primaryForeground"), secondary: hex("secondary"), accent: hex("accent"),
      background: hex("background"), surface: hex("surface"), text: hex("text"), muted: hex("muted"),
    };
    const font = (k: string) => {
      const v = str(fd, k);
      if (!(fontOptions as readonly string[]).includes(v)) throw new Error("Unsupported font");
      return v;
    };
    const buttonStyle = str(fd, "buttonStyle") as "rounded" | "pill" | "square";
    const skew = Math.min(25, Math.max(-25, Number(str(fd, "buttonSkew") || "0")));
    const textSkew = Math.min(25, Math.max(-25, Number(str(fd, "buttonTextSkew") || String(-skew))));
    const translate = Math.min(12, Math.max(-12, Number(str(fd, "buttonHoverTranslateY") || "-2")));
    if (!Number.isFinite(skew) || !Number.isFinite(textSkew) || !Number.isFinite(translate)) throw new Error("Button transforms must be numbers");
    const headerStyle = str(fd, "headerStyle");
    if (!["standard", "angled"].includes(headerStyle)) throw new Error("Invalid header style");
    const heroStyle = str(fd, "heroStyle") || (headerStyle === "angled" ? "micks-overlay" : "classic");
    if (!["classic", "micks-overlay"].includes(heroStyle)) throw new Error("Invalid home hero layout");
    // Uploaded SVG URLs must belong to the selected site's media library.
    // Clones may retain their original quote until the owner uploads a replacement.
    const quoteSvgUrl = opt(fd, "quoteSvgUrl") ?? undefined;
    const optionalHex = (field: string): string | undefined => {
      const value = str(fd, field).trim();
      if (!value) return undefined;
      if (!/^#[0-9a-fA-F]{6}$/.test(value)) throw new Error(`${field} must be a 6-digit hex color like #7198BD`);
      return value;
    };
    const quoteSvgColor = optionalHex("quoteSvgColor");
    const quoteSvgHoverColor = optionalHex("quoteSvgHoverColor");
    const serviceStepIconUrl = opt(fd, "serviceStepIconUrl") ?? undefined;
    const serviceStepIconColor = optionalHex("serviceStepIconColor");
    const serviceStepIconHoverColor = optionalHex("serviceStepIconHoverColor");
    const aboutWorkItems = str(fd, "aboutWorkItems").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 8).map((line) => {
      const [title, ...body] = line.split("|");
      return { title: title.trim(), body: body.join("|").trim() };
    }).filter((item) => item.title && item.body);
    if (quoteSvgHoverColor && !quoteSvgColor) throw new Error("Set an SVG Color before choosing an SVG Hover Color");
    if (serviceStepIconHoverColor && !serviceStepIconColor) throw new Error("Set a step-list SVG Color before choosing a Hover Color");
    const svgUrls = [quoteSvgUrl, serviceStepIconUrl].filter((url): url is string => Boolean(url));
    const [previousTheme] = await getDb().select({ design: themes.design }).from(themes).where(eq(themes.siteId, siteId));
    const inheritedUrls = [previousTheme?.design?.quoteSvgUrl, previousTheme?.design?.serviceStepIconUrl, ...(previousTheme?.design?.serviceTrustIconUrls ?? [])];
    for (const svgUrl of new Set(svgUrls)) {
      const validPath = /^\/images_nextjs\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.svg$/i.test(svgUrl);
      if (!validPath) throw new Error("Choose an uploaded SVG from the media picker");
      const [siteAsset] = await getDb().select({ id: media.id }).from(media)
        .where(and(eq(media.siteId, siteId), eq(media.url, svgUrl)));
      if (!siteAsset && !inheritedUrls.includes(svgUrl)) throw new Error("Each SVG must be uploaded to this website");
    }
    const design = {
      // Preserve older per-site design settings which this editor does not expose.
      // Otherwise saving colors can silently erase icons and custom layout options.
      ...(previousTheme?.design ?? {}),
      headerStyle: headerStyle as "standard" | "angled",
      heroStyle: heroStyle as "classic" | "micks-overlay",
      quoteSvgUrl,
      quoteSvgColor,
      quoteSvgHoverColor,
      serviceStepIconUrl,
      serviceStepIconColor,
      serviceStepIconHoverColor,
      innerHeroImageUrl: opt(fd, "innerHeroImageUrl") ?? undefined,
      serviceDefaultImageUrl: opt(fd, "serviceDefaultImageUrl") ?? undefined,
      serviceBadgeOneUrl: opt(fd, "serviceBadgeOneUrl") ?? undefined,
      serviceBadgeTwoUrl: opt(fd, "serviceBadgeTwoUrl") ?? undefined,
      serviceBadgeThreeUrl: opt(fd, "serviceBadgeThreeUrl") ?? undefined,
      serviceBadgeOneLink: opt(fd, "serviceBadgeOneLink") ?? undefined,
      serviceBadgeTwoLink: opt(fd, "serviceBadgeTwoLink") ?? undefined,
      serviceBadgeThreeLink: opt(fd, "serviceBadgeThreeLink") ?? undefined,
      serviceBadgeOneAlt: opt(fd, "serviceBadgeOneAlt") ?? undefined,
      serviceBadgeTwoAlt: opt(fd, "serviceBadgeTwoAlt") ?? undefined,
      serviceBadgeThreeAlt: opt(fd, "serviceBadgeThreeAlt") ?? undefined,
      serviceBadgeOneVisible: bool(fd, "serviceBadgeOneVisible"),
      serviceBadgeTwoVisible: bool(fd, "serviceBadgeTwoVisible"),
      serviceBadgeThreeVisible: bool(fd, "serviceBadgeThreeVisible"),
      serviceProcessImageUrl: opt(fd, "serviceProcessImageUrl") ?? undefined,
      serviceTrustImageUrl: opt(fd, "serviceTrustImageUrl") ?? undefined,
      serviceVehicleImageUrl: opt(fd, "serviceVehicleImageUrl") ?? undefined,
      footerBackgroundImageUrl: opt(fd, "footerBackgroundImageUrl") ?? undefined,
      footerPoweredLogoUrl: opt(fd, "footerPoweredLogoUrl") ?? undefined,
      footerPoweredLink: opt(fd, "footerPoweredLink") ?? undefined,
      footerPoweredText: opt(fd, "footerPoweredText") ?? undefined,
      footerFacebookText: opt(fd, "footerFacebookText") ?? undefined,
      aboutOwnerImageUrl: opt(fd, "aboutOwnerImageUrl") ?? undefined,
      aboutTeamImageUrl: opt(fd, "aboutTeamImageUrl") ?? undefined,
      aboutVehicleImageUrl: opt(fd, "aboutVehicleImageUrl") ?? undefined,
      aboutCrewImageOneUrl: opt(fd, "aboutCrewImageOneUrl") ?? undefined,
      aboutCrewImageTwoUrl: opt(fd, "aboutCrewImageTwoUrl") ?? undefined,
      aboutCrewImageThreeUrl: opt(fd, "aboutCrewImageThreeUrl") ?? undefined,
      aboutWorkItems,
      diagnosticsImageUrl: opt(fd, "diagnosticsImageUrl") ?? undefined,
      tiresImageUrl: opt(fd, "tiresImageUrl") ?? undefined,
      scheduleCtaHref: opt(fd, "scheduleCtaHref") ?? undefined,
      diagnosticsCtaHref: opt(fd, "diagnosticsCtaHref") ?? undefined,
      tiresCtaHref: opt(fd, "tiresCtaHref") ?? undefined,
      buttonBackground: hex("buttonBackground"), buttonText: hex("buttonText"),
      buttonHoverBackground: hex("buttonHoverBackground"), buttonHoverText: hex("buttonHoverText"),
      navButtonBackground: hex("navButtonBackground"), navButtonText: hex("navButtonText"),
      navButtonHoverBackground: hex("navButtonHoverBackground"), navButtonHoverText: hex("navButtonHoverText"),
      badgeBackground: hex("badgeBackground"), badgeText: hex("badgeText"),
      buttonSkew: skew, buttonTextSkew: textSkew, buttonHoverTranslateY: translate,
      footerRedlineHiddenPages: previousTheme?.design?.footerRedlineHiddenPages ?? [],
      footerLogosHiddenPages: previousTheme?.design?.footerLogosHiddenPages ?? [],
    };
    const values = {
      logoUrl: opt(fd, "logoUrl"), logoDarkUrl: opt(fd, "logoDarkUrl"), faviconUrl: opt(fd, "faviconUrl"),
      colors, fonts: { heading: font("fontHeading"), body: font("fontBody") },
      radius: /^[0-9.]+(rem|px)$/.test(str(fd, "radius")) ? str(fd, "radius") : "0.75rem",
      buttonStyle: ["rounded", "pill", "square"].includes(buttonStyle) ? buttonStyle : "rounded",
      customCss: opt(fd, "customCss"),
      design,
    };
    const db = getDb();
    const [exists] = await db.select({ id: themes.siteId }).from(themes).where(eq(themes.siteId, siteId));
    if (exists) await db.update(themes).set(values).where(eq(themes.siteId, siteId));
    else await db.insert(themes).values({ siteId, ...values });
    await afterChange(siteId, user.id, "theme.update");
    return "Branding saved";
  });
}

/* ---------------- pages ---------------- */

const cleanSlug = (v: string) => v.trim().replace(/^\/+|\/+$/g, "").toLowerCase().replace(/[^a-z0-9/-]+/g, "-");

export async function createPage(fd: FormData) {
  const siteId = str(fd, "siteId");
  const { user } = await requireSiteAccess(siteId);
  return run(`/sites/${siteId}/pages`, async () => {
    const title = str(fd, "title");
    if (!title) throw new Error("Title is required");
    const slug = cleanSlug(str(fd, "slug") || title);
    const db = getDb();
    const [clash] = await db.select({ id: pages.id }).from(pages).where(and(eq(pages.siteId, siteId), eq(pages.slug, slug)));
    if (clash) throw new Error(`A page with /${slug}/ already exists`);
    const id = crypto.randomUUID();
    const count = (await db.select({ id: pages.id }).from(pages).where(eq(pages.siteId, siteId))).length;
    await db.insert(pages).values({ id, siteId, slug, title, status: "DRAFT", sortOrder: count, showInNav: false });
    await db.insert(pageSections).values({ siteId, pageId: id, type: "rich_text", sortOrder: 0, props: { heading: title, body: "" } });
    await afterChange(siteId, user.id, "page.create", { slug });
    return { ok: "Page created as draft", to: `/sites/${siteId}/pages/${id}` };
  });
}

export async function savePageMeta(fd: FormData) {
  const siteId = str(fd, "siteId");
  const pageId = str(fd, "pageId");
  const { user } = await requireSiteAccess(siteId);
  return run(`/sites/${siteId}/pages/${pageId}`, async () => {
    const slug = cleanSlug(str(fd, "slug"));
    const db = getDb();
    const [clash] = await db.select({ id: pages.id }).from(pages).where(and(eq(pages.siteId, siteId), eq(pages.slug, slug)));
    if (clash && clash.id !== pageId) throw new Error(`Another page already uses /${slug}/`);
    const [original] = await db.select({ slug: pages.slug }).from(pages).where(and(eq(pages.id, pageId), eq(pages.siteId, siteId)));
    if (!original) throw new Error("Page not found");
    if (original.slug === "" && slug !== "") throw new Error("The homepage slug cannot change");
    if (original.slug !== "" && slug === "") throw new Error("Only the homepage may have an empty slug");
    const canonicalUrl = opt(fd, "canonicalUrl");
    if (canonicalUrl && !/^https:\/\/[^\s]+$/.test(canonicalUrl) && !canonicalUrl.startsWith("/")) throw new Error("Canonical must be an HTTPS URL or a path starting with /");
    await db.transaction(async (tx) => {
      await tx.update(pages).set({
        title: str(fd, "title"), slug, status: str(fd, "status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        seoTitle: opt(fd, "seoTitle"), seoDescription: opt(fd, "seoDescription"), seoKeywords: opt(fd, "seoKeywords"), ogImage: opt(fd, "ogImage"), showInNav: bool(fd, "showInNav"),
        canonicalUrl, noIndex: bool(fd, "noIndex"), noFollow: bool(fd, "noFollow"),
      }).where(and(eq(pages.id, pageId), eq(pages.siteId, siteId)));
      if (original.slug && original.slug !== slug) {
        const fromPath = `/${original.slug}/`;
        const toPath = `/${slug}/`;
        const [existing] = await tx.select({ id: redirects.id }).from(redirects).where(and(eq(redirects.siteId, siteId), eq(redirects.fromPath, fromPath)));
        if (existing) await tx.update(redirects).set({ toPath, code: 301 }).where(eq(redirects.id, existing.id));
        else await tx.insert(redirects).values({ siteId, fromPath, toPath, code: 301 });
      }
    });
    await afterChange(siteId, user.id, "page.update", { pageId, slug });
    return "Page saved";
  });
}

export async function deletePage(fd: FormData) {
  const siteId = str(fd, "siteId");
  const pageId = str(fd, "pageId");
  const { user } = await requireSiteAccess(siteId);
  return run(`/sites/${siteId}/pages`, async () => {
    const db = getDb();
    const [p] = await db.select().from(pages).where(and(eq(pages.id, pageId), eq(pages.siteId, siteId)));
    if (!p) throw new Error("Page not found");
    if (p.slug === "") throw new Error("The home page can't be deleted");
    await db.delete(pageSections).where(and(eq(pageSections.pageId, pageId), eq(pageSections.siteId, siteId)));
    await db.delete(pages).where(eq(pages.id, pageId));
    await afterChange(siteId, user.id, "page.delete", { slug: p.slug });
    return { ok: "Page deleted", to: `/sites/${siteId}/pages` };
  });
}

/* ---------------- sections ---------------- */

function setPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let cur = obj;
  keys.slice(0, -1).forEach((k) => {
    if (typeof cur[k] !== "object" || cur[k] === null) cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  });
  cur[keys.at(-1)!] = value;
}

function readField(fd: FormData, f: Field): unknown {
  const raw = String(fd.get(`p:${f.path}`) ?? "");
  switch (f.kind) {
    case "boolean": return fd.get(`p:${f.path}`) === "on";
    case "number": return raw.trim() === "" ? undefined : Number(raw);
    case "list": return lines(raw);
    case "pairs": return lines(raw).map((l) => {
      const [a, ...b] = l.split("|");
      return { [f.keys[0]]: a.trim(), [f.keys[1]]: b.join("|").trim() };
    });
    default: return raw.trim() === "" ? undefined : raw.trim();
  }
}

/** Drops link objects whose label and href are both empty, so optional buttons validate. */
function pruneEmptyLinks(props: Record<string, unknown>) {
  for (const [k, v] of Object.entries(props)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      if ("label" in o || "href" in o) {
        if (!o.label && !o.href) delete props[k];
      }
    }
  }
  return props;
}

export async function addSection(fd: FormData) {
  const siteId = str(fd, "siteId");
  const pageId = str(fd, "pageId");
  const type = str(fd, "type");
  const { user } = await requireSiteAccess(siteId);
  return run(`/sites/${siteId}/pages/${pageId}`, async () => {
    if (!isBlockType(type)) throw new Error("Unknown section type");
    const db = getDb();
    const [p] = await db.select({ id: pages.id }).from(pages).where(and(eq(pages.id, pageId), eq(pages.siteId, siteId)));
    if (!p) throw new Error("Page not found");
    const existing = await db.select({ id: pageSections.id }).from(pageSections).where(eq(pageSections.pageId, pageId));
    const id = crypto.randomUUID();
    await db.insert(pageSections).values({ id, siteId, pageId, type, props: defaultBlockProps(type), sortOrder: existing.length });
    await afterChange(siteId, user.id, "section.add", { pageId, type });
    return { ok: "Section added", to: `/sites/${siteId}/pages/${pageId}#s-${id}` };
  });
}

export async function saveSection(fd: FormData) {
  const siteId = str(fd, "siteId");
  const pageId = str(fd, "pageId");
  const sectionId = str(fd, "sectionId");
  const { user } = await requireSiteAccess(siteId);
  return run(`/sites/${siteId}/pages/${pageId}`, async () => {
    const db = getDb();
    const [sec] = await db.select().from(pageSections).where(and(eq(pageSections.id, sectionId), eq(pageSections.siteId, siteId)));
    if (!sec || !isBlockType(sec.type)) throw new Error("Section not found");
    const props: Record<string, unknown> = {};
    for (const f of blockFields[sec.type]) {
      const v = readField(fd, f);
      if (v !== undefined) setPath(props, f.path, v);
    }
    const parsed = blockSchemas[sec.type].safeParse(pruneEmptyLinks(props));
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      throw new Error(`Check "${i.path.join(".")}": ${i.message}`);
    }
    await db.update(pageSections).set({ props: parsed.data as Record<string, unknown>, isVisible: bool(fd, "isVisible") }).where(eq(pageSections.id, sectionId));
    await afterChange(siteId, user.id, "section.update", { pageId, sectionId, type: sec.type });
    return "Section saved";
  });
}

export async function sectionOp(fd: FormData) {
  const siteId = str(fd, "siteId");
  const pageId = str(fd, "pageId");
  const sectionId = str(fd, "sectionId");
  const op = str(fd, "op");
  const { user } = await requireSiteAccess(siteId);
  return run(`/sites/${siteId}/pages/${pageId}`, async () => {
    const db = getDb();
    const list = await db
      .select()
      .from(pageSections)
      .where(and(eq(pageSections.pageId, pageId), eq(pageSections.siteId, siteId)))
      .orderBy(asc(pageSections.sortOrder));
    const i = list.findIndex((x) => x.id === sectionId);
    if (i < 0) throw new Error("Section not found");
    if (op === "delete") {
      await db.delete(pageSections).where(eq(pageSections.id, sectionId));
      list.splice(i, 1);
    } else if (op === "up" || op === "down") {
      const j = op === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= list.length) return "Already at the edge";
      [list[i], list[j]] = [list[j], list[i]];
    } else if (op === "duplicate") {
      const copy = { ...list[i], id: crypto.randomUUID() };
      await db.insert(pageSections).values(copy);
      list.splice(i + 1, 0, copy);
    } else throw new Error("Unknown operation");
    await Promise.all(list.map((s, idx) => db.update(pageSections).set({ sortOrder: idx }).where(eq(pageSections.id, s.id))));
    await afterChange(siteId, user.id, `section.${op}`, { pageId, sectionId });
    return { delete: "Section deleted", up: "Moved up", down: "Moved down", duplicate: "Section duplicated" }[op]!;
  });
}

export async function reorderSections(fd: FormData) {
  const siteId = str(fd, "siteId");
  const pageId = str(fd, "pageId");
  const { user } = await requireSiteAccess(siteId);
  return run(`/sites/${siteId}/pages/${pageId}`, async () => {
    let order: string[];
    try { order = JSON.parse(str(fd, "order")); } catch { throw new Error("Invalid section order"); }
    if (!Array.isArray(order) || new Set(order).size !== order.length || order.some((id) => !/^[a-f0-9-]{36}$/i.test(id))) throw new Error("Invalid section order");
    const db = getDb();
    const rows = await db.select({ id: pageSections.id }).from(pageSections).where(and(eq(pageSections.siteId, siteId), eq(pageSections.pageId, pageId)));
    if (rows.length !== order.length || rows.some((row) => !order.includes(row.id))) throw new Error("Section list changed; refresh and try again");
    await db.transaction(async (tx) => Promise.all(order.map((id, sortOrder) => tx.update(pageSections).set({ sortOrder }).where(and(eq(pageSections.id, id), eq(pageSections.siteId, siteId))))));
    await afterChange(siteId, user.id, "sections.reorder", { pageId });
    return "Section order saved";
  });
}

/* ---------------- collections (services, specials, faqs, ...) ---------------- */

export async function saveCollectionItem(fd: FormData) {
  const siteId = str(fd, "siteId");
  const key = str(fd, "collection");
  const itemId = str(fd, "itemId");
  const def = collections[key];
  const { user } = await requireSiteAccess(siteId);
  return run(`/sites/${siteId}/c/${key}`, async () => {
    if (!def) throw new Error("Unknown collection");
    const values = parseCollectionForm(def, fd);
    const db = getDb();
    if (itemId) {
      await db.update(def.table).set(values).where(and(eq(def.table.id, itemId), eq(def.table.siteId, siteId)));
    } else {
      const count = (await db.select({ id: def.table.id }).from(def.table).where(eq(def.table.siteId, siteId))).length;
      await db.insert(def.table).values({ ...values, siteId, ...(def.sortable ? { sortOrder: count } : {}) });
    }
    await afterChange(siteId, user.id, `${key}.${itemId ? "update" : "create"}`);
    return { ok: `${def.singular.charAt(0).toUpperCase() + def.singular.slice(1)} saved`, to: `/sites/${siteId}/c/${key}` };
  });
}

export async function collectionOp(fd: FormData) {
  const siteId = str(fd, "siteId");
  const key = str(fd, "collection");
  const itemId = str(fd, "itemId");
  const op = str(fd, "op");
  const def = collections[key];
  const { user } = await requireSiteAccess(siteId);
  return run(`/sites/${siteId}/c/${key}`, async () => {
    if (!def) throw new Error("Unknown collection");
    const db = getDb();
    if (op === "delete") {
      await db.delete(def.table).where(and(eq(def.table.id, itemId), eq(def.table.siteId, siteId)));
    } else if ((op === "up" || op === "down") && def.sortable) {
      const list = (await db.select().from(def.table).where(eq(def.table.siteId, siteId)).orderBy(asc(def.table.sortOrder))) as { id: string }[];
      const i = list.findIndex((x: { id: string }) => x.id === itemId);
      const j = op === "up" ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= list.length) return "Already at the edge";
      [list[i], list[j]] = [list[j], list[i]];
      await Promise.all(list.map((x: { id: string }, idx: number) => db.update(def.table).set({ sortOrder: idx }).where(eq(def.table.id, x.id))));
    } else throw new Error("Unknown operation");
    await afterChange(siteId, user.id, `${key}.${op}`, { itemId });
    return op === "delete" ? "Deleted" : "Reordered";
  });
}

/* ---------------- navigation ---------------- */

/** "Label | /href" per line; indent with two spaces (or start with "-") for a dropdown child. */
function parseMenu(text: string): MenuItem[] {
  const items: MenuItem[] = [];
  for (const rawLine of text.replace(/\r/g, "").split("\n")) {
    if (!rawLine.trim()) continue;
    const child = /^(\s{2,}|\t|-\s)/.test(rawLine);
    const [label, href, badge] = rawLine.replace(/^\s*-\s*/, "").split("|").map((x) => x.trim());
    if (!label || !href) throw new Error(`Menu line needs "Label | /link": ${rawLine.trim()}`);
    if (child && items.length) (items.at(-1)!.children ??= []).push({ label, href, ...(badge ? { badge } : {}) });
    else items.push({ label, href, ...(badge ? { badge } : {}) });
  }
  return items;
}

export async function saveMenus(fd: FormData) {
  const siteId = str(fd, "siteId");
  const { user } = await requireSiteAccess(siteId);
  return run(`/sites/${siteId}/navigation`, async () => {
    const db = getDb();
    for (const location of ["header", "footer"] as const) {
      const raw = str(fd, `${location}Json`);
      let items: MenuItem[];
      if (raw) {
        let value: unknown;
        try { value = JSON.parse(raw); } catch { throw new Error("Navigation data is invalid"); }
        if (!Array.isArray(value)) throw new Error("Navigation data is invalid");
        items = value.map((item) => ({
          label: String(item?.label ?? "").trim(), href: String(item?.href ?? "").trim(),
          children: Array.isArray(item?.children) ? item.children.map((child: Record<string, unknown>) => ({ label: String(child.label ?? "").trim(), href: String(child.href ?? "").trim() })).filter((child: MenuItem) => child.label && child.href) : undefined,
        })).filter((item) => item.label && item.href) as MenuItem[];
      } else items = parseMenu(str(fd, location));
      const [m] = await db.select().from(menus).where(and(eq(menus.siteId, siteId), eq(menus.location, location)));
      if (m) await db.update(menus).set({ items }).where(eq(menus.id, m.id));
      else await db.insert(menus).values({ siteId, location, items });
    }
    const [pageRows, serviceRows] = await Promise.all([
      db.select({ slug: pages.slug }).from(pages).where(eq(pages.siteId, siteId)),
      db.select({ slug: services.slug }).from(services).where(eq(services.siteId, siteId)),
    ]);
    const targets = [...new Set([...pageRows, ...serviceRows].map((row) => row.slug).filter(Boolean))];
    const shownRedline = new Set(fd.getAll("footerRedlineVisible").map(String));
    const shownLogos = new Set(fd.getAll("footerLogosVisible").map(String));
    const footerRedlineHiddenPages = targets.filter((slug) => !shownRedline.has(slug));
    const footerLogosHiddenPages = targets.filter((slug) => !shownLogos.has(slug));
    const [theme] = await db.select({ design: themes.design }).from(themes).where(eq(themes.siteId, siteId));
    if (theme) await db.update(themes).set({ design: { ...(theme.design ?? {}), footerRedlineHiddenPages, footerLogosHiddenPages } }).where(eq(themes.siteId, siteId));
    await afterChange(siteId, user.id, "menus.update");
    return "Navigation saved";
  });
}

/* ---------------- domains ---------------- */

export async function domainOp(fd: FormData) {
  const siteId = str(fd, "siteId");
  const op = str(fd, "op");
  const { user } = await requireSiteAccess(siteId, "OWNER");
  return run(`/sites/${siteId}/domains`, async () => {
    const db = getDb();
    if (op === "add") {
      const hostname = str(fd, "hostname").toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(hostname)) throw new Error("Enter a domain like example.com");
      const [taken] = await db.select().from(domains).where(eq(domains.hostname, hostname));
      if (taken) throw new Error(taken.siteId === siteId ? "Already added" : "That domain belongs to another site");
      const existing = await db.select().from(domains).where(eq(domains.siteId, siteId));
      await db.insert(domains).values({ siteId, hostname, isPrimary: existing.length === 0 });
      await afterChange(siteId, user.id, "domain.add", { hostname });
      return `Added ${hostname}. Point its DNS at the platform (see instructions).`;
    }
    const id = str(fd, "domainId");
    const [d] = await db.select().from(domains).where(and(eq(domains.id, id), eq(domains.siteId, siteId)));
    if (!d) throw new Error("Domain not found");
    if (op === "remove") await db.delete(domains).where(eq(domains.id, id));
    else if (op === "primary") {
      await db.update(domains).set({ isPrimary: false }).where(eq(domains.siteId, siteId));
      await db.update(domains).set({ isPrimary: true }).where(eq(domains.id, id));
    } else if (op === "verify") {
      // DNS checks do not prove the hosting provider has issued an SSL certificate.
      const expectedA = process.env.DOMAIN_EXPECTED_A?.trim();
      const expectedCname = process.env.DOMAIN_EXPECTED_CNAME?.trim().replace(/\.$/, "").toLowerCase();
      if (!expectedA && !expectedCname) throw new Error("Configure DOMAIN_EXPECTED_A or DOMAIN_EXPECTED_CNAME before verifying domains");
      const [addresses, aliases] = await Promise.all([
        resolve4(d.hostname).catch(() => [] as string[]),
        resolveCname(d.hostname).catch(() => [] as string[]),
      ]);
      const matchingA = Boolean(expectedA && addresses.includes(expectedA));
      const matchingCname = Boolean(expectedCname && aliases.some((a) => a.replace(/\.$/, "").toLowerCase() === expectedCname));
      if (!matchingA && !matchingCname) throw new Error("DNS does not point to the configured platform target yet");
      await db.update(domains).set({ verified: true, sslStatus: "PENDING" }).where(eq(domains.id, id));
    } else throw new Error("Unknown operation");
    await afterChange(siteId, user.id, `domain.${op}`, { hostname: d.hostname });
    return { remove: "Domain removed", primary: "Primary domain updated", verify: "DNS verified; check SSL with your hosting provider" }[op]!;
  });
}

/* ---------------- booking ---------------- */

export async function saveBooking(fd: FormData) {
  const siteId = str(fd, "siteId");
  const { user } = await requireSiteAccess(siteId);
  return run(`/sites/${siteId}/booking`, async () => {
    const section = str(fd, "section") || "availability";
    const values: Partial<typeof bookingSettings.$inferInsert> = {};
    if (section === "availability") {
      const time = (k: string) => {
        const v = str(fd, k);
        if (!/^\d{2}:\d{2}$/.test(v)) throw new Error("Times must be HH:MM");
        return v;
      };
      values.enabled = bool(fd, "enabled");
      values.slotMinutes = Math.max(10, int(fd, "slotMinutes", 30));
      values.openTime = time("openTime");
      values.closeTime = time("closeTime");
      values.closedDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => bool(fd, `closed_${d}`));
      values.leadDays = Math.max(0, int(fd, "leadDays", 0));
      values.disabledDates = lines(str(fd, "disabledDates")).filter((v) => /^\d{4}-\d{2}-\d{2}$/.test(v));
    } else if (section === "appearance") {
      const color = (key: string, fallback: string) => {
        const value = str(fd, key);
        if (value && !/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`${key} must be a six-digit hex color`);
        return value || fallback;
      };
      values.appearance = {
        accentColor: color("accentColor", "#d1272c"),
        accentTextColor: color("accentTextColor", "#ffffff"),
        formBackground: color("formBackground", "#ffffff"),
        formTextColor: color("formTextColor", "#111111"),
        inputBackground: color("inputBackground", "#ffffff"),
        inputTextColor: color("inputTextColor", "#111111"),
        logoUrl: str(fd, "logoUrl"),
        landingHeading: str(fd, "landingHeading") || "Book Your Service",
        appointmentHeading: str(fd, "appointmentHeading") || "Schedule Your Service Online",
      };
    } else if (section === "notifications") {
      values.notifyEmails = emails(str(fd, "notifyEmails"));
      values.notifySms = lines(str(fd, "notifySms"));
      values.confirmationMessage = opt(fd, "confirmationMessage");
    } else if (section === "templates") {
      values.adminEmailSubject = opt(fd, "adminEmailSubject");
      values.adminEmailTemplate = opt(fd, "adminEmailTemplate");
      values.customerEmailSubject = opt(fd, "customerEmailSubject");
      values.customerEmailTemplate = opt(fd, "customerEmailTemplate");
      values.smsTemplate = opt(fd, "smsTemplate");
    } else if (section === "fields") {
      let parsedFields: unknown;
      try { parsedFields = JSON.parse(str(fd, "formFields") || "[]"); }
      catch { throw new Error("Booking field settings are invalid JSON"); }
      const result = fieldsSchema.safeParse(parsedFields);
      if (!result.success) throw new Error(`Booking fields: ${result.error.issues[0].message}`);
      values.formFields = result.data;
    } else throw new Error("Unknown booking settings section");
    const db = getDb();
    const [b] = await db.select().from(bookingSettings).where(eq(bookingSettings.siteId, siteId));
    if (b) await db.update(bookingSettings).set(values).where(eq(bookingSettings.siteId, siteId));
    else await db.insert(bookingSettings).values({ siteId, closedDays: [0, 6], notifyEmails: [], notifySms: [], ...values });
    await afterChange(siteId, user.id, "booking.update");
    return "Booking settings saved";
  });
}

export async function setAppointmentStatus(fd: FormData) {
  const siteId = str(fd, "siteId");
  const id = str(fd, "appointmentId");
  const status = str(fd, "status") as (typeof appointmentStatus)[number];
  const { user } = await requireSiteAccess(siteId);
  return run(`/sites/${siteId}/booking`, async () => {
    if (!appointmentStatus.includes(status)) throw new Error("Bad status");
    await getDb().update(appointments).set({ status }).where(and(eq(appointments.id, id), eq(appointments.siteId, siteId)));
    await audit(user.id, siteId, "appointment.status", { id, status });
    revalidatePath(`/sites/${siteId}/booking`);
    return `Marked ${status.toLowerCase()}`;
  });
}

/* ---------------- integrations ---------------- */

export async function saveIntegrations(fd: FormData) {
  const siteId = str(fd, "siteId");
  const { user } = await requireSiteAccess(siteId);
  return run(`/sites/${siteId}/integrations`, async () => {
    const db = getDb();
    const configs: Record<(typeof integrationTypes)[number], Record<string, string>> = {
      ga4: { measurementId: str(fd, "ga4_measurementId") },
      gtm: { containerId: str(fd, "gtm_containerId") },
      meta_pixel: { pixelId: str(fd, "meta_pixel_pixelId") },
      tire_finder: { url: str(fd, "tire_finder_url"), label: str(fd, "tire_finder_label") || "Tire finder" },
      ai_diagnostic: { url: str(fd, "ai_diagnostic_url"), label: str(fd, "ai_diagnostic_label") || "AI diagnostic tool" },
      chat: { url: str(fd, "chat_url") },
      custom_head: { note: str(fd, "custom_head_note") },
    };
    for (const type of integrationTypes.filter((item) => item !== "tire_finder" && item !== "ai_diagnostic")) {
      const config = configs[type];
      const enabled = bool(fd, `${type}_enabled`);
      const [row] = await db.select().from(integrations).where(and(eq(integrations.siteId, siteId), eq(integrations.type, type)));
      if (row) await db.update(integrations).set({ config, enabled }).where(eq(integrations.id, row.id));
      else if (enabled || Object.values(config).some(Boolean)) await db.insert(integrations).values({ siteId, type, config, enabled });
    }
    await afterChange(siteId, user.id, "integrations.update");
    return "Integrations saved";
  });
}

/* ---------------- users & members ---------------- */

export async function createUser(fd: FormData) {
  const admin = await requireSuperAdmin();
  return run(`/users`, async () => {
    const email = str(fd, "email").toLowerCase();
    const password = str(fd, "password");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Valid email required");
    if (password.length < 10) throw new Error("Password must be at least 10 characters");
    const db = getDb();
    const [exists] = await db.select().from(users).where(eq(users.email, email));
    if (exists) throw new Error("User already exists");
    const id = crypto.randomUUID();
    await db.insert(users).values({ id, email, name: opt(fd, "name"), passwordHash: await bcrypt.hash(password, 10), globalRole: str(fd, "globalRole") === "SUPER_ADMIN" ? "SUPER_ADMIN" : "USER" });
    const siteId = str(fd, "siteId");
    if (siteId) await db.insert(siteMembers).values({ siteId, userId: id, role: (siteRoles as readonly string[]).includes(str(fd, "role")) ? (str(fd, "role") as "EDITOR") : "EDITOR" });
    await audit(admin.id, siteId || null, "user.create", { email });
    return `User ${email} created`;
  });
}

export async function memberOp(fd: FormData) {
  const siteId = str(fd, "siteId");
  const op = str(fd, "op");
  const { user } = await requireSiteAccess(siteId, "OWNER");
  return run(`/sites/${siteId}/team`, async () => {
    const db = getDb();
    if (op === "add") {
      const [u] = await db.select().from(users).where(eq(users.email, str(fd, "email").toLowerCase()));
      if (!u) throw new Error("No user with that email. Create them under Users first.");
      const role = str(fd, "role") as "OWNER" | "EDITOR" | "VIEWER";
      if (!siteRoles.includes(role)) throw new Error("Bad role");
      const [m] = await db.select().from(siteMembers).where(and(eq(siteMembers.siteId, siteId), eq(siteMembers.userId, u.id)));
      if (m) await db.update(siteMembers).set({ role }).where(eq(siteMembers.id, m.id));
      else await db.insert(siteMembers).values({ siteId, userId: u.id, role });
      await audit(user.id, siteId, "member.add", { email: u.email, role });
      revalidatePath(`/sites/${siteId}/team`);
      return `${u.email} is now ${role.toLowerCase()}`;
    }
    if (op === "remove") {
      await db.delete(siteMembers).where(and(eq(siteMembers.id, str(fd, "memberId")), eq(siteMembers.siteId, siteId)));
      await audit(user.id, siteId, "member.remove");
      revalidatePath(`/sites/${siteId}/team`);
      return "Removed";
    }
    throw new Error("Unknown operation");
  });
}
