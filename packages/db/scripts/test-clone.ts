/** Integration test: clone copies content, keeps tenants isolated, and delete cleans up. */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { getDb, closeDb } from "../src/client";
import * as s from "../src/schema";
import { cloneSite } from "../src/clone";
import { deleteSite, setSiteStatus } from "../src/site-ops";
import { getPageBySlug, resolveHost, listServices } from "../src/queries";

const db = getDb();
const count = async (t: any, siteId: string) => (await db.select().from(t).where(eq(t.siteId, siteId))).length;

async function main() {
  const [src] = await db.select().from(s.sites).where(eq(s.sites.slug, "micks-repair"));
  assert.ok(src, "run db:seed first");
  const [stale] = await db.select().from(s.sites).where(eq(s.sites.slug, "clone-test"));
  if (stale) await deleteSite(stale.id);

  const { siteId } = await cloneSite({ sourceSiteId: src.id, name: "Clone Test Auto", slug: "Clone Test" });
  try {
    const [clone] = await db.select().from(s.sites).where(eq(s.sites.id, siteId));
    assert.equal(clone.slug, "clone-test");
    assert.equal(clone.status, "DRAFT");
    assert.equal(clone.clonedFromId, src.id);

    for (const t of [s.pages, s.pageSections, s.services, s.specials, s.faqs, s.caseStudies, s.menus, s.redirects, s.locations]) {
      assert.equal(await count(t, siteId), await count(t, src.id), `copied ${(t as any)[Symbol.for("drizzle:Name")]}`);
    }
    assert.equal(await count(s.domains, siteId), 0, "domains not copied");
    assert.equal(await count(s.appointments, siteId), 0, "appointments not copied");

    const [settings] = await db.select().from(s.siteSettings).where(eq(s.siteSettings.siteId, siteId));
    assert.equal(settings.businessName, "Clone Test Auto");
    assert.equal(settings.ratingCount, null, "rating not inherited");

    // sections point at the clone's own pages
    const home = await getPageBySlug(siteId, "");
    assert.ok(home && home.sections.length > 0);
    assert.ok(home.sections.every((x) => x.siteId === siteId && x.pageId === home.page.id));

    // isolation: editing the clone does not touch the source
    const [svc] = await listServices(siteId);
    await db.update(s.services).set({ name: "Changed in clone" }).where(eq(s.services.id, svc.id));
    const srcNames = (await listServices(src.id)).map((x) => x.name);
    assert.ok(!srcNames.includes("Changed in clone"), "source untouched");

    // subdomain resolution + status
    const r = await resolveHost("clone-test.localhost:3000", "localhost:3000");
    assert.equal(r?.siteId, siteId);
    await setSiteStatus(siteId, "PUBLISHED");
    assert.equal((await resolveHost("clone-test.localhost:3000", "localhost:3000"))?.status, "PUBLISHED");
    assert.equal(await count(s.siteVersions, siteId), 1, "publish snapshots a version");
    assert.equal((await resolveHost("www.micksrepair.com"))?.siteId, src.id, "custom domain resolves");

    // duplicate slug rejected
    await assert.rejects(cloneSite({ sourceSiteId: src.id, name: "x", slug: "clone-test" }), /already exists/);
  } finally {
    await deleteSite(siteId);
  }
  assert.equal(await count(s.pages, siteId), 0, "delete cleans up");
  console.log("✓ clone / isolation / publish / delete tests passed");
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(closeDb);
