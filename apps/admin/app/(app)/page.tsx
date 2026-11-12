import Link from "next/link";
import { getDb, sites, siteMembers, themes, appointments, auditLog, eq, desc, count, and, inArray } from "@platform/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, StatusBadge } from "@/components/ui";
import { SiteIdentity } from "@/components/SiteIdentity";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const user = await requireUser();
  const db = getDb();
  let visibleSites = await db.select().from(sites).orderBy(desc(sites.updatedAt));
  if (user.globalRole !== "SUPER_ADMIN") {
    const memberships = await db.select({ siteId: siteMembers.siteId }).from(siteMembers).where(eq(siteMembers.userId, user.id));
    const allowed = new Set(memberships.map((m) => m.siteId));
    visibleSites = visibleSites.filter((site) => allowed.has(site.id));
  }
  const siteIds = visibleSites.map((site) => site.id);
  const isSuper = user.globalRole === "SUPER_ADMIN";
  const totals = siteIds.length ? await Promise.all([
    db.select({ total: count() }).from(appointments).where(and(inArray(appointments.siteId, siteIds), eq(appointments.status, "NEW"))),
    db.select({ siteId: themes.siteId, logoUrl: themes.logoUrl }).from(themes).where(inArray(themes.siteId, siteIds)),
    db.select({ id: auditLog.id, siteId: auditLog.siteId, action: auditLog.action, createdAt: auditLog.createdAt }).from(auditLog).where(inArray(auditLog.siteId, siteIds)).orderBy(desc(auditLog.createdAt)).limit(8),
  ]) : null;
  const appointmentCount = totals?.[0]?.[0]?.total ?? 0;
  const logos = totals?.[1] ?? [];
  const activity = totals?.[2] ?? [];
  const logoMap = new Map(logos.map((logo) => [logo.siteId, logo.logoUrl]));
  const nameMap = new Map(visibleSites.map((site) => [site.id, site.name]));
  const liveCount = visibleSites.filter((site) => site.status === "PUBLISHED").length;
  const offlineCount = visibleSites.length - liveCount;
  const statusGroups = [
    { label: "Published", total: liveCount, bar: "bg-emerald-500", dot: "bg-emerald-500" },
    { label: "Draft", total: visibleSites.filter((site) => site.status === "DRAFT").length, bar: "bg-sky-500", dot: "bg-sky-500" },
    { label: "Unpublished", total: visibleSites.filter((site) => site.status === "UNPUBLISHED").length, bar: "bg-amber-500", dot: "bg-amber-500" },
    { label: "Archived", total: visibleSites.filter((site) => site.status === "ARCHIVED").length, bar: "bg-slate-400", dot: "bg-slate-400" },
  ];
  const metrics = [
    { label: "Websites", number: visibleSites.length, hint: "Sites in your workspace", tone: "indigo" },
    { label: "Live", number: liveCount, hint: "Currently published", tone: "emerald" },
    { label: "Needs publishing", number: offlineCount, hint: "Draft or offline", tone: "amber" },
    { label: "New appointments", number: appointmentCount, hint: "Awaiting a response", tone: "rose" },
  ];
  return (
    <main className="admin-page space-y-7">
      <PageHeader title="Workspace dashboard" description="Monitor every website from one place, then open a site to manage its own dashboard." actions={<div className="flex flex-wrap gap-2"><Link className="btn btn-secondary" href="/sites">Manage websites</Link>{isSuper && <Link className="btn btn-primary" href="/sites/new">+ New website</Link>}</div>} />
      <section aria-label="Workspace totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <div key={metric.label} className="metric-card"><span className={`metric-card__mark metric-card__mark--${metric.tone}`} aria-hidden="true" /><div><p className="text-sm font-semibold text-slate-600">{metric.label}</p><p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-slate-950">{metric.number}</p><p className="mt-1.5 text-xs text-slate-500">{metric.hint}</p></div></div>)}
      </section>
      <section className="card p-5" aria-labelledby="dashboard-publishing">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2"><h2 id="dashboard-publishing" className="font-semibold">Publishing overview</h2><span className="text-xs text-slate-500">Statuses across your websites</span></div>
        <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${liveCount} live websites out of ${visibleSites.length}`}>
          {statusGroups.map((group) => <span key={group.label} className={group.bar} style={{ width: `${visibleSites.length ? (group.total / visibleSites.length) * 100 : 0}%` }} />)}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600">
          {statusGroups.map((group) => <span key={group.label} className="inline-flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${group.dot}`} />{group.label}: <strong>{group.total}</strong></span>)}
        </div>
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="card min-w-0 overflow-hidden" aria-labelledby="dashboard-websites">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-5"><div><h2 id="dashboard-websites" className="font-semibold">Site dashboards</h2><p className="text-xs text-slate-500">Open a website’s dedicated dashboard and tools</p></div><Link href="/sites" className="text-sm font-semibold text-indigo-700 hover:underline">View directory</Link></div>
          {visibleSites.length === 0 ? <p className="p-6 text-sm text-slate-500">No websites yet. Create a website to get started.</p> : <div className="divide-y divide-slate-100">
            {visibleSites.slice(0, 7).map((site) => <div key={site.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><SiteIdentity name={site.name} slug={site.slug} logoUrl={logoMap.get(site.id)} compact /><div className="flex items-center gap-2"><StatusBadge status={site.status} /><Link className="btn btn-secondary btn-sm" href={`/sites/${site.id}`}>Open dashboard</Link></div></div>)}
          </div>}
        </section>
        <section className="card min-w-0 overflow-hidden" aria-labelledby="dashboard-activity">
          <div className="border-b border-slate-100 p-5"><h2 id="dashboard-activity" className="font-semibold">Recent activity</h2><p className="text-xs text-slate-500">Changes made to your websites</p></div>
          {activity.length ? <ul className="divide-y divide-slate-100">{activity.map((entry) => <li key={entry.id} className="px-5 py-3"><p className="break-words text-sm font-medium text-slate-800">{entry.action.replace(/\./g, " ")}</p><div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{entry.siteId ? nameMap.get(entry.siteId) ?? "Website" : "System"}</span><time dateTime={new Date(entry.createdAt).toISOString()}>{new Date(entry.createdAt).toLocaleString()}</time></div></li>)}</ul> : <p className="p-5 text-sm text-slate-500">No recent website activity.</p>}
        </section>
      </div>
    </main>
  );
}
