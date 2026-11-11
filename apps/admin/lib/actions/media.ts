"use server";
import { requireSiteAccess } from "../auth";
import { afterChange } from "../mutate";
import { run } from "./run";
import { storeMediaFile } from "../media";

export async function uploadMedia(fd: FormData) {
  const siteId = String(fd.get("siteId") ?? "");
  const { user } = await requireSiteAccess(siteId);
  return run(`/sites/${siteId}/media`, async () => {
    const file = fd.get("file");
    if (!(file instanceof File)) throw new Error("Choose an image");
    const requested = Number(fd.get("maxWidth") ?? "1600");
    const row = await storeMediaFile({ siteId, file, alt: String(fd.get("alt") ?? ""), maxWidth: requested });
    await afterChange(siteId, user.id, "media.upload", { url: row.url, width: row.width ?? undefined, height: row.height ?? undefined, bytes: row.size });
    return `Uploaded ${row.width}x${row.height}, ${Math.ceil(row.size / 1024)} KB WebP`;
  });
}
