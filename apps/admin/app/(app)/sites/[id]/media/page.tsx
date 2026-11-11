import { getDb, media, eq, desc } from "@platform/db";
import { loadSite } from "@/lib/site";
import { uploadMedia } from "@/lib/actions/media";
import { PageHeader, Card, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/ConfirmButton";

export default async function MediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await loadSite(id, "EDITOR");
  const rows = await getDb().select().from(media).where(eq(media.siteId, id)).orderBy(desc(media.createdAt));
  const publicOrigin = (process.env.SITES_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return <>
    <PageHeader title="Media library" description="Per-site images. Upload and optimize files locally, then use the URL in any page, card or branding field." />
    <Card title="Upload & optimize" className="mb-6">
      <form action={uploadMedia} className="grid gap-4 sm:grid-cols-2">
        <input name="siteId" type="hidden" value={id} />
        <label className="block"><span className="label">Image</span><input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/tiff,image/avif,image/svg+xml,.tif,.tiff,.avif,.svg" className="input" required /><span className="help">JPG, PNG, GIF, WebP, AVIF, SVG, TIF, or TIFF up to 12 MB.</span></label>
        <label className="block"><span className="label">Max width (pixels)</span><input name="maxWidth" type="number" min="100" max="3000" defaultValue="1600" className="input" /></label>
        <label className="block sm:col-span-2"><span className="label">Image alt text</span><input name="alt" className="input" maxLength={255} /></label>
        <div className="sm:col-span-2"><SubmitButton>Upload as optimized WebP</SubmitButton></div>
      </form>
      <p className="help mt-3">No upscaling. Best-effort 100 KB target. Local filesystem uploads work only during local development or on a persistent shared server. On Vercel, this screen requires an S3/R2 adapter before production use.</p>
    </Card>
    <Card title={`Your site's images (${rows.length})`}>
      {rows.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rows.map((img) => <div key={img.id} className="rounded-md border border-slate-200 p-3">
        <div className="mb-2 aspect-video rounded bg-slate-100"><img src={img.url.startsWith("/") ? `${publicOrigin}${img.url}` : img.url} alt={img.alt ?? ""} className="h-full w-full object-contain" loading="lazy" /></div>
        <p className="text-xs text-slate-600">{img.width}x{img.height} · <span className={(img.size ?? 0) > 102400 ? "text-red-700 font-semibold" : ""}>{img.size != null ? `${(img.size / 1024).toFixed(1)} KB` : "Size unknown"}</span></p>
        <input className="input mt-2 w-full font-mono text-xs" value={img.url} readOnly aria-label="Media URL, select to copy" />
        <p className="mt-1 truncate text-xs text-slate-500">{img.alt || "No alt text"}</p>
      </div>)}</div> : <Empty>No images uploaded for this website yet.</Empty>}
    </Card>
  </>;
}
