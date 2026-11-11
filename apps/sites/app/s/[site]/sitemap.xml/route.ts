export const dynamic = "force-dynamic";
import { getBundle, getPages, getServices, parseSiteParam } from "@/lib/data";
import { siteOrigin } from "@/lib/url";

export async function GET(_req: Request, { params }: { params: Promise<{ site: string }> }) {
  const ctx = parseSiteParam((await params).site);
  if (ctx.preview) return new Response("Not found", { status: 404 });
  const bundle = await getBundle(ctx);
  const origin = siteOrigin(bundle);
  const pages = await getPages(ctx);
  const services = await getServices(ctx);
  const urls = [
    ...pages.map((p) => ({ loc: `${origin}/${p.slug ? `${p.slug}/` : ""}`, lastmod: p.updatedAt })),
    ...services.map((s) => ({ loc: `${origin}/${s.slug}/`, lastmod: null })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ""}</url>`)
    .join("\n")}\n</urlset>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
