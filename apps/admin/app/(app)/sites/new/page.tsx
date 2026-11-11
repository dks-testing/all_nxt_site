import Link from "next/link";
import { getDb, sites, desc } from "@platform/db";
import { requireSuperAdmin } from "@/lib/auth";
import { createSite } from "@/lib/actions/sites";
import { PageHeader, Card, Input } from "@/components/ui";
import { SubmitButton } from "@/components/ConfirmButton";

export const metadata = { title: "New site" };

export default async function NewSitePage() {
  await requireSuperAdmin();
  const all = await getDb().select({ id: sites.id, name: sites.name, isTemplate: sites.isTemplate }).from(sites).orderBy(desc(sites.isTemplate), sites.name);
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">← Sites</Link>
      <PageHeader title="New website" description="Start from a copy of an existing site (fastest) or a blank starter." />
      <Card>
        <form action={createSite} className="space-y-4">
          <Input label="Business / site name" name="name" required placeholder="Smith Auto Care" />
          <Input label="Slug" name="slug" placeholder="smith-auto-care" help="Used for the preview address <slug>.yourplatform.com. Leave empty to generate from the name." />
          <fieldset>
            <legend className="label">Start from</legend>
            <div className="space-y-2">
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="radio" name="source" value="blank" /> <span><strong>Blank starter</strong> · home, services and contact pages</span></label>
              {all.map((s, i) => (
                <label key={s.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm">
                  <input type="radio" name="source" value={s.id} defaultChecked={i === 0} />
                  <span><strong>Clone {s.name}</strong>{s.isTemplate ? " · template" : ""} · pages, branding, services, specials, FAQ</span>
                </label>
              ))}
            </div>
          </fieldset>
          <SubmitButton>Create site</SubmitButton>
        </form>
      </Card>
    </main>
  );
}
