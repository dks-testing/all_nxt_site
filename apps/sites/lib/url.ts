import type { SiteBundle } from "@platform/db";

/** Use one local host with database-backed /site-slug/page-slug routes. */
export function localSiteHref(slug: string, href: string) {
  if (process.env.NODE_ENV !== "development" && process.env.LOCAL_PATH_ROUTING !== "true") return href;
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const prefix = `/${slug}`;
  if (href === prefix || href.startsWith(`${prefix}/`)) return href;
  return href === "/" ? `${prefix}/` : `${prefix}${href}`;
}

/** Base URL for local SEO/JSON-LD; only production uses domain routing. */
export function siteOrigin(bundle: SiteBundle) {
  if (process.env.NODE_ENV === "development" || process.env.LOCAL_PATH_ROUTING === "true") {
    const base = (process.env.SITES_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
    return `${base}/${bundle.site.slug}`;
  }
  if (bundle.primaryDomain) return `https://${bundle.primaryDomain}`;
  const root = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost:3000";
  const proto = root.startsWith("localhost") ? "http" : "https";
  return `${proto}://${bundle.site.slug}.${root}`;
}
