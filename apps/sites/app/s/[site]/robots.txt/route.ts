export const dynamic = "force-dynamic";
import { getBundle, parseSiteParam } from "@/lib/data";
import { siteOrigin } from "@/lib/url";

export async function GET(_req: Request, { params }: { params: Promise<{ site: string }> }) {
  const ctx = parseSiteParam((await params).site);
  if (ctx.preview) return new Response("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain" } });
  const bundle = await getBundle(ctx);
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin(bundle)}/sitemap.xml\n`, { headers: { "content-type": "text/plain" } });
}
