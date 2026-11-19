import Link from "next/link";
import { getDb, auditLog, siteVersions, appointments, pages, services, users, eq, desc, and, count } from "@platform/db";
import { loadSite } from "@/lib/site";
import { platformUrl } from "@/lib/site-url";
import { restoreVersionAction, deleteSiteAction, setStatus, syncCloneSectionsAction } from "@/lib/actions/sites";
import { Card, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/ConfirmButton";

export default async function Overview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { site, domains, user, role } = await loadSite(id);
  const db = getDb();
  const [[pageCount], [serviceCount], [newAppts], [publishedPages]] = await Promise.all([
    db.select({ n: count() }).from(pages).where(eq(pages.siteId, id)),
    db.select({ n: count() }).from(services).where(eq(services.siteId, id)),
    db.select({ n: count() }).from(appointments).where(and(eq(appointments.siteId, id), eq(appointments.status, "NEW"))),
    db.select({ n: count() }).from(pages).where(and(eq(pages.siteId, id), eq(pages.status, "PUBLISHED"))),
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
    { label: "Pages", value: pageCount.n, hint: "Total content pages", tone: "indigo", icon: "M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3M14 3h7v7M21 3l-9 9M7 13h2m-2 4h10", href: `/sites/${id}/pages` },
    { label: "Services", value: serviceCount.n, hint: "In your service catalog", tone: "amber", icon: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5", href: `/sites/${id}/c/services` },
    { label: "New appointments", value: newAppts.n, hint: "Requests awaiting a response", tone: "rose", icon: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm4 11 2 2 4-4", href: `/sites/${id}/booking` },
    { label: "Published pages", value: publishedPages.n, hint: "Pages marked as published", tone: "emerald", icon: "M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z", href: `/sites/${id}/pages` },
    ...(process.env.NODE_ENV === "development" ? [] : [{ label: "Domains", value: domains.length, hint: "Connected site addresses", tone: "indigo", icon: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z", href: `/sites/${id}/domains` }]),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Site dashboard" description={`Manage ${site.name}, review activity, and jump directly to the tools you use most.`} />
      <div className={`grid gap-4 sm:grid-cols-2 ${stats.length === 5 ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`site-stat-card site-stat-card--${s.tone} group`}>
            <div className="site-stat-card__top"><span className="site-stat-card__icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg></span><svg className="site-stat-card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg></div>
            <div><p className="text-xs font-semibold text-slate-600">{s.label}</p><p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-slate-900">{s.value}</p><p className="mt-2 text-xs leading-5 text-slate-500">{s.hint}</p></div>
          </Link>
        ))}
      </div>

      <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <Card title="Quick actions" description="Common tasks for this website.">
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                ["Edit pages", "Update page content and sections", `/sites/${id}/pages`],
                ["Header & footer", "Manage public navigation", `/sites/${id}/navigation`],
                ["Booking", "Availability and requests", `/sites/${id}/booking`],
                ["Branding", "Logo, colours and typography", `/sites/${id}/branding`],
              ].map(([label, description, href]) => <Link key={label} href={href} className="quick-action"><span className="quick-action__icon" aria-hidden="true">→</span><strong>{label}</strong><small>{description}</small></Link>)}
            </div>
          </Card>

          <div className="grid gap-6 2xl:grid-cols-2">
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

          {role === "OWNER" && (
            <Card title="Danger zone" className="danger-zone">
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
        <aside className="relative min-h-0 min-w-0" aria-label="Site activity">
          <Card title="Activity" className="flex min-h-0 flex-col xl:absolute xl:inset-0 [&>div]:shrink-0">
            {log.length ? <ul tabIndex={0} aria-label="Activity entries" className="min-h-0 max-h-[32rem] overflow-y-auto overscroll-contain divide-y divide-slate-100 pr-3 text-sm [scrollbar-gutter:stable] focus-visible:outline-2 focus-visible:outline-indigo-500 xl:max-h-none xl:flex-1">
              {log.map((l, i) => (
                <li key={i} className="space-y-1.5 break-words py-3"><p><code className="text-xs">{l.action}</code></p><p className="text-xs text-slate-500">by {l.email ?? "system"}</p><time className="block text-xs text-slate-500" dateTime={new Date(l.createdAt).toISOString()}>{new Date(l.createdAt).toLocaleString()}</time></li>
              ))}
            </ul> : <p className="text-sm text-slate-500">No activity has been recorded for this site yet.</p>}
          </Card>
        </aside>
      </div>
    </div>
  );
}
