import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { resolveSiteSlug } from "@platform/db";
import SitePage, { generateMetadata as pageMetadata } from "@/app/s/[site]/[[...slug]]/page";

type Props = { params: Promise<{ siteSlug: string; slug?: string[] }>; searchParams?: Promise<Record<string, string | string[] | undefined>> };

/** Resolve /micks-repair/about-us/ -> site ID + page slug from MySQL. */
async function resolvedParams(params: Props["params"]) {
  const { siteSlug, slug } = await params;
  const site = await resolveSiteSlug(siteSlug);
  if (!site || site.status === "ARCHIVED") notFound();
  if (site.status !== "PUBLISHED") redirect("/system/unavailable");
  return { site: site.siteId, slug };
}

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return pageMetadata({ params: Promise.resolve(await resolvedParams(params)) });
}

export default async function LocalSitePage({ params, searchParams }: Props) {
  return <SitePage params={Promise.resolve(await resolvedParams(params))} searchParams={searchParams} />;
}
