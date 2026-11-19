import Link from "next/link";
import { loadSite } from "@/lib/site";
import { getDb, themes, eq } from "@platform/db";
import { SiteIdentity } from "@/components/SiteIdentity";
import { publicUrl, platformUrl, previewUrl } from "@/lib/site-url";
import { setStatus } from "@/lib/actions/sites";
import { StatusBadge } from "@/components/ui";
import { SiteNav } from "@/components/SiteNav";
import { SubmitButton } from "@/components/ConfirmButton";

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { site, primary, role } = await loadSite(id);
  const live = site.status === "PUBLISHED";
  const [theme] = await getDb().select({ logoUrl: themes.logoUrl }).from(themes).where(eq(themes.siteId, id)).limit(1);
  return (
    <div className="admin-page">
      <div className="site-workspace-header sticky top-[4.5rem] z-30 mb-6 flex min-h-[4.5rem] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-3 py-3 sm:px-4 lg:flex-nowrap">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Link href="/sites" aria-label="Website directory" className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-700 sm:px-2">
            <span aria-hidden="true">←</span><span className="hidden sm:inline">Website directory</span>
          </Link>
          <span aria-hidden="true" className="hidden h-8 w-px shrink-0 bg-slate-200 sm:block" />
          <h1 className="min-w-0 truncate text-base font-bold leading-tight">
            <SiteIdentity
              name={site.name}
              logoUrl={theme?.logoUrl}
              compact
              subtitle={process.env.NODE_ENV === "development" ? `Local: ${platformUrl(site.slug).replace(/^https?:\/\//, "")}` : primary ?? `${site.slug} · no custom domain yet`}
            />
          </h1>
          <StatusBadge status={site.status} />
        </div>
        <div className="flex w-full shrink-0 flex-wrap gap-2 lg:w-auto">
          <a href={await previewUrl(site)} target="_blank" rel="noreferrer" className="btn btn-secondary min-w-0 flex-1 lg:flex-none">Preview draft</a>
          {live && <a href={publicUrl(site, primary)} target="_blank" rel="noreferrer" className="btn btn-secondary min-w-0 flex-1 lg:flex-none">View site ↗</a>}
          {role === "OWNER" && (
            <form action={setStatus} className="min-w-0 flex-1 lg:flex-none">
              <input type="hidden" name="siteId" value={site.id} />
              {live ? (
                <><input type="hidden" name="status" value="UNPUBLISHED" /><SubmitButton className="btn btn-danger w-full lg:w-auto" confirm="Unpublish this site? Visitors will see a 'temporarily unavailable' page.">Unpublish</SubmitButton></>
              ) : (
                <><input type="hidden" name="status" value="PUBLISHED" /><SubmitButton className="btn btn-primary w-full lg:w-auto">Publish site</SubmitButton></>
              )}
            </form>
          )}
        </div>
      </div>
      <div className="grid gap-7 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="admin-sidebar p-3 lg:sticky lg:top-24 lg:self-start"><SiteNav siteId={site.id} /></aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
