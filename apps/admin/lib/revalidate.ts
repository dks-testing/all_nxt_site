/** Tells the sites app to drop its cache for one site (pages rebuild on next visit). */
export async function revalidateSite(siteId: string) {
  const base = process.env.SITES_APP_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!base || !secret) return { ok: false, error: "SITES_APP_URL / REVALIDATE_SECRET not set" };
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/revalidate/`, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
      body: JSON.stringify({ siteId }),
      cache: "no-store",
    });
    return { ok: res.ok, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e) {
    console.error("[revalidate] failed", e);
    return { ok: false, error: e instanceof Error ? e.message : "fetch failed" };
  }
}
