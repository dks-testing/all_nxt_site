import Link from "next/link";
import { getDb, sites, domains, siteMembers, eq, desc, inArray } from "@platform/db";
import { requireUser } from "@/lib/auth";
import { publicUrl, previewUrl } from "@/lib/site-url";
import { setStatus, cloneSiteAction } from "@/lib/actions/sites";
import { PageHeader, StatusBadge, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/ConfirmButton";

export const metadata = { title: "Sites" };

export default async function SitesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const user = await requireUser();
  const { q = "", status = "" } = await searchParams;
  const db = getDb();
  let rows = await db.select().from(sites).orderBy(desc(sites.updatedAt));
  if (user.globalRole !== "SUPER_ADMIN") {
    const mine = (await db.select({ siteId: siteMembers.siteId }).from(siteMembers).where(eq(siteMembers.userId, user.id))).map((m) => m.siteId);
    rows = rows.filter((r) => mine.includes(r.id));
  }
  const localMode = process.env.NODE_ENV === "development";
  const allDomains = !localMode && rows.length ? await db.select().from(domains).where(inArray(domains.siteId, rows.map((r) => r.id))) : [];
  const counts = Object.fromEntries(["PUBLISHED", "DRAFT", "UNPUBLISHED", "ARCHIVED"].map((s) => [s, rows.filter((r) => r.status === s).length]));
  const filtered = rows.filter((r) => (!status || r.status === status) && (!q || `${r.name} ${r.slug}`.toLowerCase().includes(q.toLowerCase())));
  const isSuper = user.globalRole === "SUPER_ADMIN";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Websites"
        description={`${rows.length} sites · ${counts.PUBLISHED} live`}
        actions={isSuper && <Link href="/sites/new" className="btn btn-primary">+ New site</Link>}
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search sites…" className="input max-w-xs" />
        <select name="status" defaultValue={status} className="input max-w-[11rem]">
          <option value="">All statuses</option>
          {Object.entries(counts).map(([s, n]) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()} ({n})</option>)}
        </select>
        <button className="btn btn-secondary">Filter</button>
      </form>

      {filtered.length === 0 ? (
        <Empty>No sites match. {isSuper && <Link href="/sites/new" className="font-semibold text-[var(--color-brand)]">Create one</Link>}</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>Site</th><th>{localMode ? "Local website" : "Domain"}</th><th>Status</th><th>Last published</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {await Promise.all(filtered.map(async (s) => {
                const ds = allDomains.filter((d) => d.siteId === s.id);
                const primary = ds.find((d) => d.isPrimary)?.hostname ?? ds[0]?.hostname;
                return (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td>
                      <Link href={`/sites/${s.id}`} className="font-semibold hover:text-[var(--color-brand)]">{s.name}</Link>
                      <div className="text-xs text-slate-500">{s.slug}{s.isTemplate && " · template"}</div>
                    </td>
                    <td className="text-slate-600">{localMode ? <a href={publicUrl(s)} target="_blank" rel="noreferrer" className="text-indigo-700 hover:underline">{publicUrl(s).replace(/^https?:\/\//, "")}</a> : primary ?? <span className="text-slate-400">No custom domain</span>}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td className="text-slate-500">{s.publishedAt ? new Date(s.publishedAt).toLocaleDateString() : "–"}</td>
                    <td>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Link href={`/sites/${s.id}`} className="btn btn-secondary btn-sm">Edit</Link>
                        <a href={s.status === "PUBLISHED" ? publicUrl(s, primary) : await previewUrl(s)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                          {s.status === "PUBLISHED" ? "View" : "Preview"}
                        </a>
                        <form action={setStatus}>
                          <input type="hidden" name="siteId" value={s.id} />
                          <input type="hidden" name="back" value="/" />
                          {s.status === "PUBLISHED" ? (
                            <><input type="hidden" name="status" value="UNPUBLISHED" /><SubmitButton className="btn btn-secondary btn-sm" confirm={`Unpublish ${s.name}? Visitors will see a "temporarily unavailable" page.`}>Unpublish</SubmitButton></>
                          ) : (
                            <><input type="hidden" name="status" value="PUBLISHED" /><SubmitButton className="btn btn-primary btn-sm">Publish</SubmitButton></>
                          )}
                        </form>
                        {isSuper && (
                          <details className="relative">
                            <summary className="btn btn-secondary btn-sm list-none">Clone</summary>
                            <form action={cloneSiteAction} className="card absolute right-0 z-10 mt-1 w-72 space-y-3 p-4 shadow-lg">
                              <input type="hidden" name="sourceId" value={s.id} />
                              <p className="text-sm font-semibold">Clone “{s.name}”</p>
                              <label className="block"><span className="label">New site name</span><input name="name" required className="input" placeholder="Smith Auto Care" /></label>
                              <label className="block"><span className="label">Slug</span><input name="slug" className="input" placeholder="smith-auto-care" /></label>
                              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="includeTestimonials" /> Copy testimonials</label>
                              <p className="help">Copies pages, branding, services and settings as a draft. Bookings and analytics IDs are not copied.</p>
                              <SubmitButton className="btn btn-primary w-full">Clone site</SubmitButton>
                            </form>
                          </details>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
