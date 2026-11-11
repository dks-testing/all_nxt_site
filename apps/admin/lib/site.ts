import { notFound } from "next/navigation";
import { getDb, sites, domains, eq } from "@platform/db";
import { requireSiteAccess } from "./auth";

/** Loads a site for an admin page, enforcing at least VIEWER access. */
export async function loadSite(siteId: string, min: "VIEWER" | "EDITOR" | "OWNER" = "VIEWER") {
  let access;
  try {
    access = await requireSiteAccess(siteId, min);
  } catch {
    notFound();
  }
  const [site] = await getDb().select().from(sites).where(eq(sites.id, siteId)).limit(1);
  if (!site) notFound();
  const ds = await getDb().select().from(domains).where(eq(domains.siteId, siteId));
  const primary = ds.find((d) => d.isPrimary)?.hostname ?? ds[0]?.hostname ?? null;
  return { site, domains: ds, primary, ...access };
}
