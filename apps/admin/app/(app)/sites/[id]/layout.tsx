import Link from "next/link";
import { loadSite } from "@/lib/site";
import { publicUrl, platformUrl, previewUrl } from "@/lib/site-url";
import { setStatus } from "@/lib/actions/sites";
import { StatusBadge } from "@/components/ui";
import { SiteNav } from "@/components/SiteNav";
import { SubmitButton } from "@/components/ConfirmButton";

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { site, primary, role } = await loadSite(id);
  const live = site.status === "PUBLISHED";
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="card mb-7 flex flex-wrap items-center justify-between gap-4 overflow-hidden p-5">
        <div>
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-800">← All sites</Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-xl font-bold">{site.name}</h1>
            <StatusBadge status={site.status} />
          </div>
          <p className="mt-0.5 text-sm text-slate-500">{process.env.NODE_ENV === "development" ? `Local: ${platformUrl(site.slug).replace(/^https?:\/\//, "")}` : primary ?? `${site.slug} · no custom domain yet`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={await previewUrl(site)} target="_blank" rel="noreferrer" className="btn btn-secondary">Preview draft</a>
          {live && <a href={publicUrl(site, primary)} target="_blank" rel="noreferrer" className="btn btn-secondary">View site ↗</a>}
          {role === "OWNER" && (
            <form action={setStatus}>
              <input type="hidden" name="siteId" value={site.id} />
              {live ? (
                <><input type="hidden" name="status" value="UNPUBLISHED" /><SubmitButton className="btn btn-danger" confirm="Unpublish this site? Visitors will see a 'temporarily unavailable' page.">Unpublish</SubmitButton></>
              ) : (
                <><input type="hidden" name="status" value="PUBLISHED" /><SubmitButton>Publish site</SubmitButton></>
              )}
            </form>
          )}
        </div>
      </div>
      <div className="grid gap-7 lg:grid-cols-[14rem_1fr]">
        <aside className="card p-3 lg:sticky lg:top-24 lg:self-start"><SiteNav siteId={site.id} /></aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
