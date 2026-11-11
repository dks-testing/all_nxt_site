import { resolveSiteSlug } from "@platform/db";
import { GET as handleSiteRoute } from "@/app/s/[site]/sitemap.xml/route";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ siteSlug: string }> }) {
  const { siteSlug } = await params;
  const site = await resolveSiteSlug(siteSlug);
  if (!site || site.status !== "PUBLISHED") return new Response("Not found", { status: 404 });
  return handleSiteRoute(request, { params: Promise.resolve({ site: site.siteId }) });
}
