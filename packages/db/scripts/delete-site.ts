/** Usage: pnpm --filter @platform/db exec tsx --env-file=../../.env scripts/delete-site.ts <slug> */
import { eq } from "drizzle-orm";
import { getDb, closeDb } from "../src/client";
import { sites } from "../src/schema";
import { deleteSite } from "../src/site-ops";

const slug = process.argv[2];
(async () => {
  const [s] = await getDb().select().from(sites).where(eq(sites.slug, slug ?? ""));
  if (!s) console.log(`No site "${slug}"`);
  else { await deleteSite(s.id); console.log(`Deleted ${s.name}`); }
})().finally(closeDb);
