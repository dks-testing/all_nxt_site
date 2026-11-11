import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { resolveSiteSlug } from "@platform/db";
import SiteLayout, { generateMetadata as siteMetadata } from "@/app/s/[site]/layout";

type Props = { params: Promise<{ siteSlug: string }> };

/** Local site slugs are resolved by the route, not by a hostname rewrite. */
async function siteIdFromSlug(slug: string) {
  const site = await resolveSiteSlug(slug);
  if (!site || site.status === "ARCHIVED") notFound();
  if (site.status !== "PUBLISHED") redirect("/system/unavailable");
  return site.siteId;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { siteSlug } = await params;
  const site = await siteIdFromSlug(siteSlug);
  return siteMetadata({ params: Promise.resolve({ site }) });
}

export default async function LocalSiteLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { siteSlug } = await params;
  const site = await siteIdFromSlug(siteSlug);
  return <SiteLayout params={Promise.resolve({ site })}>{children}</SiteLayout>;
}
