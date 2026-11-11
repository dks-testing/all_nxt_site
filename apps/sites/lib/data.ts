import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import * as q from "@platform/db";

/**
 * Every read is cached under the tag `site:<id>`. The admin app calls /api/revalidate on publish,
 * which expires that tag so only that site's pages rebuild. Draft previews bypass the cache.
 */
export const siteTag = (siteId: string) => `site:${siteId}`;

export type SiteCtx = { siteId: string; preview: boolean };

/** "/s/<id>" = public (cached), "/p/preview--<id>" = draft preview (uncached; only reachable via the proxy with a signed token). */
export function parseSiteParam(param: string): SiteCtx {
  const decoded = decodeURIComponent(param);
  if (decoded.startsWith("preview--")) return { siteId: decoded.slice("preview--".length), preview: true };
  return { siteId: decoded, preview: false };
}

function cached<A extends unknown[], R>(name: string, fn: (siteId: string, ...a: A) => Promise<R>) {
  return (ctx: SiteCtx, ...args: A): Promise<R> => {
    if (ctx.preview) return fn(ctx.siteId, ...args);
    return unstable_cache(() => fn(ctx.siteId, ...args), [name, ctx.siteId, JSON.stringify(args)], {
      tags: [siteTag(ctx.siteId)],
    })();
  };
}

const bundleRaw = cached("bundle", q.getSiteBundle);
export async function getBundle(ctx: SiteCtx) {
  const b = await bundleRaw(ctx);
  if (!b) notFound();
  // Defence in depth: the proxy already blocks unpublished sites, but never render them without preview.
  if (!ctx.preview && b.site.status !== "PUBLISHED") notFound();
  return b;
}

export const getPage = cached("page", (siteId: string, slug: string) => q.getPageBySlug(siteId, slug));
export const getPageDraft = (ctx: SiteCtx, slug: string) => q.getPageBySlug(ctx.siteId, slug, { includeDrafts: true });
export const getServices = cached("services", q.listServices);
export const getService = cached("service", (siteId: string, slug: string) => q.getService(siteId, slug));
export const getSpecials = cached("specials", q.listSpecials);
export const getTestimonials = cached("testimonials", q.listTestimonials);
export const getFaqs = cached("faqs", q.listFaqs);
export const getCaseStudies = cached("caseStudies", q.listCaseStudies);
export const getHeroBanner = cached("heroBanner", (siteId: string) => q.getActiveBanner(siteId, "hero"));
export const getTopBar = cached("topBar", (siteId: string) => q.getActiveBanner(siteId, "top_bar"));
export const getPages = cached("pages", q.listPublishedPages);
