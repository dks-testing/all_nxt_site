import { signPreviewToken } from "@platform/db/preview";

export function platformUrl(slug: string) {
  if (process.env.NODE_ENV === "development" || process.env.LOCAL_PATH_ROUTING === "true") {
    const base = (process.env.SITES_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
    return `${base}/${slug}/`;
  }
  const root = process.env.PLATFORM_ROOT_DOMAIN ?? "localhost:3000";
  const proto = root.startsWith("localhost") ? "http" : "https";
  return `${proto}://${slug}.${root}`;
}
export function publicUrl(site: { slug: string }, primaryDomain?: string | null) {
  if (process.env.NODE_ENV === "development" || process.env.LOCAL_PATH_ROUTING === "true") return platformUrl(site.slug);
  return primaryDomain ? `https://${primaryDomain}` : platformUrl(site.slug);
}
export async function previewUrl(site: { id: string; slug: string }, path = "/") {
  const token = await signPreviewToken(site.id);
  const base = platformUrl(site.slug).replace(/\/+$/, "");
  const nextPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${nextPath}${nextPath.includes("?") ? "&" : "?"}preview=${encodeURIComponent(token)}`;
}
