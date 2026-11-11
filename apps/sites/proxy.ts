import { NextResponse, type NextRequest } from "next/server";
import { resolveHost, resolveSiteSlug, getDb, redirects, eq, type ResolvedSite } from "@platform/db";
import { verifyPreviewToken } from "@platform/db/preview";

/**
 * Public routing:
 * - Local: /<siteSlug>/<pageSlug> is an ACTUAL App Router route, not a rewrite.
 *   The route itself resolves the site from MySQL. No local domain or DNS entry is needed.
 * - Non-local: retain the legacy hostname routing for eventual deployment.
 *
 * Never expose /s/<siteId> or /p/preview--<siteId> directly: these are internal
 * rendering routes and /p can render unpublished content.
 */
const TTL_MS = 30_000;
const hostCache = new Map<string, { at: number; site: ResolvedSite | null }>();
const redirectCache = new Map<string, { at: number; rows: { fromPath: string; toPath: string; code: number }[] }>();
const PREVIEW_COOKIE = "__site_preview";
const RESERVED = new Set(["s", "p"]);

async function lookupHost(host: string) {
  const hit = hostCache.get(host);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.site;
  const site = await resolveHost(host);
  hostCache.set(host, { at: Date.now(), site });
  return site;
}

async function lookupRedirects(siteId: string) {
  const hit = redirectCache.get(siteId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.rows;
  const rows = await getDb()
    .select({ fromPath: redirects.fromPath, toPath: redirects.toPath, code: redirects.code })
    .from(redirects)
    .where(eq(redirects.siteId, siteId));
  redirectCache.set(siteId, { at: Date.now(), rows });
  return rows;
}

function localPathsEnabled(req: NextRequest) {
  // req.nextUrl.hostname is the URL being served. The forwarded-host header may
  // be changed by a development proxy and must not decide local path routing.
  const hostname = req.nextUrl.hostname.toLowerCase();
  return process.env.LOCAL_PATH_ROUTING === "true" || hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "0.0.0.0";
}

function matchingRedirect(
  rows: { fromPath: string; toPath: string; code: number }[],
  path: string,
  query: string,
) {
  const candidates = new Set([path + query, path, path.replace(/\/+$/, ""), `${path.replace(/\/+$/, "")}/`]);
  return rows.find((r) => candidates.has(r.fromPath) && r.toPath !== path &&
    r.toPath.startsWith("/") && !r.toPath.startsWith("//") && !/[\r\n]/.test(r.toPath));
}

export async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const segments = url.pathname.split("/").filter(Boolean);

  if (localPathsEnabled(req)) {
    const siteSlug = segments[0];
    const defaultSlug = process.env.LOCAL_DEFAULT_SITE_SLUG?.trim() || "micks-repair";

    // Block direct access to the private renderer (including preview pages).
    if (siteSlug && RESERVED.has(siteSlug)) {
      return NextResponse.rewrite(new URL("/system/no-site", req.url));
    }

    // Root opens the default site and preserves legacy WordPress ?p= redirects.
    if (!siteSlug) {
      if (url.searchParams.has("p")) {
        try {
          const defaultSite = await resolveSiteSlug(defaultSlug);
          if (defaultSite) {
            const rule = matchingRedirect(await lookupRedirects(defaultSite.siteId), "/", url.search);
            if (rule) return NextResponse.redirect(new URL(`/${defaultSite.slug}${rule.toPath}`, req.url), rule.code === 302 ? 302 : 301);
          }
        } catch (error) {
          console.error("[proxy] local legacy redirect lookup failed", error);
        }
      }
      return NextResponse.redirect(new URL(`/${defaultSlug}/`, req.url), 307);
    }

    // The browser route /<siteSlug>/[[...slug]] handles site/page lookup.
    // Never replace a valid local path with /system/no-site just because a
    // hostname lookup or middleware-only check failed.
    // Preserve site-specific WordPress redirects, including slug changes.
    let site: ResolvedSite | null = null;
    try {
      site = await resolveSiteSlug(siteSlug);
      if (site) {
        const publicPath = `/${segments.slice(1).join("/")}${url.pathname.endsWith("/") && segments.length > 1 ? "/" : ""}`;
        const rule = matchingRedirect(await lookupRedirects(site.siteId), publicPath, url.search);
        if (rule) return NextResponse.redirect(new URL(`/${site.slug}${rule.toPath}`, req.url), rule.code === 302 ? 302 : 301);
      }
    } catch (error) {
      console.error("[proxy] local redirect lookup failed; falling back to direct route", error);
    }

    // Draft previews are still token-protected and use the existing /p renderer.
    const tokenFromQuery = url.searchParams.get("preview");
    const token = tokenFromQuery ?? req.cookies.get(PREVIEW_COOKIE)?.value;
    if (site && token && await verifyPreviewToken(token, site.siteId)) {
      const publicPath = `/${segments.slice(1).join("/")}${url.pathname.endsWith("/") && segments.length > 1 ? "/" : ""}`;
      const target = new URL(`/p/preview--${site.siteId}${publicPath}`, req.url);
      url.searchParams.forEach((v, k) => k !== "preview" && target.searchParams.set(k, v));
      const response = NextResponse.rewrite(target);
      response.headers.set("x-robots-tag", "noindex");
      if (tokenFromQuery) response.cookies.set(PREVIEW_COOKIE, tokenFromQuery, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 86400 });
      return response;
    }
    const response = NextResponse.next();
    response.headers.set("x-shop-platform-route", "local-path");
    return response;
  }

  // Existing hostname routing remains available when deployment is enabled.
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").toLowerCase();
  let site: ResolvedSite | null;
  try {
    site = await lookupHost(host);
  } catch (error) {
    console.error("[proxy] host lookup failed", error);
    return NextResponse.rewrite(new URL("/system/error", req.url));
  }
  if (!site || site.status === "ARCHIVED") return NextResponse.rewrite(new URL("/system/no-site", req.url));

  const rows = await lookupRedirects(site.siteId);
  const rule = matchingRedirect(rows, url.pathname, url.search);
  if (rule) return NextResponse.redirect(new URL(rule.toPath, req.url), rule.code === 302 ? 302 : 301);

  const tokenFromQuery = url.searchParams.get("preview");
  const token = tokenFromQuery ?? req.cookies.get(PREVIEW_COOKIE)?.value;
  const preview = token ? await verifyPreviewToken(token, site.siteId) : false;
  if (site.status !== "PUBLISHED" && !preview) return NextResponse.rewrite(new URL("/system/unavailable", req.url));

  const target = new URL(preview ? `/p/preview--${site.siteId}${url.pathname}` : `/s/${site.siteId}${url.pathname}`, req.url);
  url.searchParams.forEach((v, k) => k !== "preview" && target.searchParams.set(k, v));
  const response = NextResponse.rewrite(target);
  response.headers.set("x-site-id", site.siteId);
  if (tokenFromQuery && preview) response.cookies.set(PREVIEW_COOKIE, tokenFromQuery, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 86400 });
  if (preview) response.headers.set("x-robots-tag", "noindex");
  return response;
}

export const config = {
  matcher: ["/((?!_next/|api/|system/|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$).*)"],
};
