import Link from "next/link";
import { getDb, auditLog, siteVersions, appointments, pages, services, users, eq, desc, and, count } from "@platform/db";
import { loadSite } from "@/lib/site";
import { platformUrl } from "@/lib/site-url";
import { restoreVersionAction, deleteSiteAction, setStatus, syncCloneSectionsAction } from "@/lib/actions/sites";
import { Card } from "@/components/ui";
import { SubmitButton } from "@/components/ConfirmButton";

export default async function Overview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { site, domains, user, role } = await loadSite(id);
  const db = getDb();
  const [[pageCount], [serviceCount], [newAppts]] = await Promise.all([
    db.select({ n: count() }).from(pages).where(eq(pages.siteId, id)),
    db.select({ n: count() }).from(services).where(eq(services.siteId, id)),
    db.select({ n: count() }).from(appointments).where(and(eq(appointments.siteId, id), eq(appointments.status, "NEW"))),
  ]);
  const versions = await db.select({ id: siteVersions.id, note: siteVersions.note, createdAt: siteVersions.createdAt }).from(siteVersions).where(eq(siteVersions.siteId, id)).orderBy(desc(siteVersions.createdAt)).limit(8);
  const log = await db
    .select({ action: auditLog.action, createdAt: auditLog.createdAt, email: users.email })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.userId))
    .where(eq(auditLog.siteId, id))
    .orderBy(desc(auditLog.createdAt))
    .limit(15);

  const stats = [
    { label: "Pages", value: pageCount.n, href: `/sites/${id}/pages` },
    { label: "Services", value: serviceCount.n, href: `/sites/${id}/c/services` },
    { label: "New appointment requests", value: newAppts.n, href: `/sites/${id}/booking` },
    ...(process.env.NODE_ENV === "development" ? [] : [{ label: "Domains", value: domains.length, href: `/sites/${id}/domains` }]),
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-4 hover:border-indigo-300">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title={process.env.NODE_ENV === "development" ? "Local access" : "Addresses"} description={process.env.NODE_ENV === "development" ? "Your site is available locally, no domain or DNS setup required." : "Where this site can be reached."}>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between gap-3"><span className="text-slate-500">{process.env.NODE_ENV === "development" ? "Local website" : "Platform address"}</span><a className="font-medium text-[var(--color-brand)]" href={platformUrl(site.slug)} target="_blank" rel="noreferrer">{platformUrl(site.slug).replace(/^https?:\/\//, "")}</a></li>
            {process.env.NODE_ENV !== "development" && domains.map((d) => (
              <li key={d.id} className="flex justify-between gap-3"><span className="text-slate-500">{d.isPrimary ? "Primary domain" : "Domain"}</span><span className="font-medium">{d.hostname} {d.verified ? "✓" : <span className="text-amber-600">(DNS pending)</span>}</span></li>
            ))}
          </ul>
          {site.clonedFromId && <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3"><p className="text-sm font-semibold text-indigo-900">Template updates</p><p className="mb-3 text-xs text-indigo-800">Refresh this clone’s page sections from its source template. Business details, branding, services and SEO are preserved.</p><form action={syncCloneSectionsAction}><input type="hidden" name="siteId" value={id} /><SubmitButton className="btn btn-secondary btn-sm" confirm="Replace this clone’s page sections with the latest source-template sections?">Apply latest template sections</SubmitButton></form></div>}
        </Card>

        <Card title="Published versions" description="A snapshot is saved each time you publish. Restore to roll back content.">
          {versions.length === 0 ? <p className="text-sm text-slate-500">Not published yet.</p> : (
            <ul className="divide-y divide-slate-100 text-sm">
              {versions.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-2">
                  <span>{new Date(v.createdAt).toLocaleString()} <span className="text-slate-500">· {v.note}</span></span>
                  {role === "OWNER" && (
                    <form action={restoreVersionAction}>
                      <input type="hidden" name="siteId" value={id} />
                      <input type="hidden" name="versionId" value={v.id} />
                      <SubmitButton className="btn btn-secondary btn-sm" confirm="Restore this version? Current pages, settings and content will be replaced.">Restore</SubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Activity">
        <ul className="divide-y divide-slate-100 text-sm">
          {log.map((l, i) => (
            <li key={i} className="flex justify-between gap-3 py-2"><span><code className="text-xs">{l.action}</code> <span className="text-slate-500">by {l.email ?? "system"}</span></span><span className="text-slate-500">{new Date(l.createdAt).toLocaleString()}</span></li>
          ))}
        </ul>
      </Card>

      {role === "OWNER" && (
        <Card title="Danger zone">
          <div className="flex flex-wrap items-end gap-6">
            <form action={setStatus}>
              <input type="hidden" name="siteId" value={id} />
              <input type="hidden" name="status" value={site.status === "ARCHIVED" ? "DRAFT" : "ARCHIVED"} />
              <SubmitButton className="btn btn-secondary" confirm={site.status === "ARCHIVED" ? undefined : "Archive this site? It will go offline and be hidden from default views."}>{site.status === "ARCHIVED" ? "Restore from archive" : "Archive site"}</SubmitButton>
            </form>
            {user.globalRole === "SUPER_ADMIN" && (
              <form action={deleteSiteAction} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="siteId" value={id} />
                <label><span className="label">Type <code>{site.slug}</code> to delete permanently</span><input name="confirmSlug" className="input w-64" autoComplete="off" /></label>
                <SubmitButton className="btn btn-danger" confirm="Permanently delete this site and all its content?">Delete site</SubmitButton>
              </form>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
