import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb, pages, pageSections, media, eq, and, asc, desc } from "@platform/db";
import { blockLabels, blockTypes, isBlockType } from "@platform/db/blocks";
import { loadSite } from "@/lib/site";
import { previewUrl } from "@/lib/site-url";
import { savePageMeta, deletePage, addSection, saveSection, sectionOp, reorderSections } from "@/lib/actions/content";
import { Card, Input, Textarea, Checkbox } from "@/components/ui";
import { SectionFields } from "@/components/SectionForm";
import { SectionEditor } from "@/components/SectionEditor";
import { SortableSections } from "@/components/SortableSections";
import { SubmitButton } from "@/components/ConfirmButton";
import { MediaPicker } from "@/components/MediaPicker";

const collectionHint: Partial<Record<string, [string, string]>> = {
  services_grid: ["c/services", "Services"],
  specials: ["c/specials", "Specials"],
  reviews: ["c/testimonials", "Testimonials"],
  case_studies: ["c/case-studies", "Case studies"],
  faq: ["c/faqs", "FAQ"],
  contact_map: ["business", "Business info"],
  booking_form: ["booking", "Booking settings"],
  embed: ["integrations", "Integrations"],
};

export default async function PageEditor({ params }: { params: Promise<{ id: string; pageId: string }> }) {
  const { id, pageId } = await params;
  const { site } = await loadSite(id, "EDITOR");
  const db = getDb();
  const [page] = await db.select().from(pages).where(and(eq(pages.id, pageId), eq(pages.siteId, id)));
  if (!page) notFound();
  const sections = await db.select().from(pageSections).where(and(eq(pageSections.pageId, pageId), eq(pageSections.siteId, id))).orderBy(asc(pageSections.sortOrder));
  const assets = await db.select({ id: media.id, url: media.url, alt: media.alt, width: media.width, height: media.height }).from(media).where(eq(media.siteId, id)).orderBy(desc(media.createdAt));
  const publicOrigin = (process.env.SITES_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const pagePreviewUrl = await previewUrl(site, page.slug ? `/${page.slug}/` : "/");
  const hidden = (sId: string) => <><input type="hidden" name="siteId" value={id} /><input type="hidden" name="pageId" value={pageId} />{sId && <input type="hidden" name="sectionId" value={sId} />}</>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/sites/${id}/pages`} className="text-xs text-slate-500 hover:text-slate-800">← Pages</Link>
          <h1 className="text-2xl font-bold">{page.title}</h1>
          <p className="font-mono text-xs text-slate-500">/{page.slug}{page.slug ? "/" : ""}</p>
        </div>
        <a href={pagePreviewUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">Preview page ↗</a>
      </div>

      <details className="card group">
        <summary className="flex items-center justify-between p-5 font-semibold">Page settings & SEO <span className="text-slate-400 group-open:rotate-180">⌄</span></summary>
        <form action={savePageMeta} className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-2">
          {hidden("")}
          <Input label="Title" name="title" defaultValue={page.title} required />
          <Input label="URL slug" name="slug" defaultValue={page.slug} help={page.slug === "" ? "Empty = home page" : undefined} />
          <Input label="SEO title" name="seoTitle" defaultValue={page.seoTitle ?? ""} className="sm:col-span-2" />
          <Textarea label="SEO description" name="seoDescription" defaultValue={page.seoDescription ?? ""} rows={2} className="sm:col-span-2" />
          <Input label="SEO keywords" name="seoKeywords" defaultValue={page.seoKeywords ?? ""} className="sm:col-span-2" help="Optional comma-separated phrases. Titles, descriptions and page content remain more important for search." />
          <Input label="Canonical URL (optional; HTTPS or relative path)" name="canonicalUrl" defaultValue={page.canonicalUrl ?? ""} className="sm:col-span-2" />
          <div className="sm:col-span-2 flex flex-wrap gap-4"><Checkbox label="Noindex" name="noIndex" defaultChecked={page.noIndex} /><Checkbox label="Nofollow" name="noFollow" defaultChecked={page.noFollow} /></div>
          <MediaPicker siteId={id} name="ogImage" label="Social share image" value={page.ogImage ?? ""} assets={assets} publicOrigin={publicOrigin} maxWidth={1200} className="sm:col-span-2" />
          <label className="block"><span className="label">Status</span><select name="status" defaultValue={page.status} className="input"><option value="PUBLISHED">Published</option><option value="DRAFT">Draft (preview only)</option></select></label>
          <div className="flex items-end"><Checkbox label="Show in navigation" name="showInNav" defaultChecked={page.showInNav} /></div>
          <div className="flex gap-2 sm:col-span-2"><SubmitButton>Save page settings</SubmitButton></div>
        </form>
        {page.slug !== "" && (
          <form action={deletePage} className="border-t border-slate-100 p-5">{hidden("")}<SubmitButton className="btn btn-danger btn-sm" confirm="Delete this page and its sections?">Delete page</SubmitButton></form>
        )}
      </details>

      <div>
        <h2 className="mb-3 font-semibold">Sections <span className="font-normal text-slate-500">· top to bottom</span></h2>
        <SortableSections action={reorderSections} siteId={id} pageId={pageId}>
          {sections.map((s, i) => {
            if (!isBlockType(s.type)) return null;
            const sectionType = s.type;
            const hint = collectionHint[s.type];
            const summary = (s.props as { heading?: string }).heading;
            return (
              <details key={s.id} id={`s-${s.id}`} data-section-id={s.id} className={`card group ${s.isVisible ? "" : "opacity-60"}`}>
                <summary className="flex items-center gap-3 p-4">
                  <button type="button" draggable data-drag-handle className="cursor-grab rounded-md px-1 text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing" title="Drag to reorder" aria-label={`Drag ${blockLabels[s.type]} section to reorder`}>⋮⋮</button>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-600">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{blockLabels[s.type]}</span>
                    {summary && <span className="ml-2 truncate text-sm text-slate-500">{summary}</span>}
                    {!s.isVisible && <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs">hidden</span>}
                  </span>
                  <span className="flex gap-1">
                    {(["up", "down", "duplicate", "delete"] as const).map((op) => (
                      <form key={op} action={sectionOp}>
                        {hidden(s.id)}<input type="hidden" name="op" value={op} />
                        <SubmitButton className={`btn btn-sm ${op === "delete" ? "btn-danger" : "btn-secondary"}`} confirm={op === "delete" ? "Delete this section?" : undefined}>
                          {{ up: "↑", down: "↓", duplicate: "Copy", delete: "Delete" }[op]}
                        </SubmitButton>
                      </form>
                    ))}
                  </span>
                </summary>
                <SectionEditor action={saveSection} type={sectionType} sectionId={s.id} previewBaseUrl={pagePreviewUrl} initialProps={s.props} visible={s.isVisible} hidden={hidden(s.id)} hint={hint && <p className="mb-4 rounded-md bg-indigo-50 px-3 py-2 text-xs text-indigo-800">This section shows content from <Link className="font-semibold underline" href={`/sites/${id}/${hint[0]}`}>{hint[1]}</Link>.</p>}>
                  <SectionFields type={sectionType} props={s.props} siteId={id} media={assets} publicOrigin={publicOrigin} />
                </SectionEditor>
              </details>
            );
          })}
        </SortableSections>
      </div>

      <Card title="Add a section">
        <form action={addSection} className="flex flex-wrap items-end gap-3">
          {hidden("")}
          <label className="block"><span className="label">Section type</span>
            <select name="type" className="input w-72">{blockTypes.map((t) => <option key={t} value={t}>{blockLabels[t]}</option>)}</select>
          </label>
          <SubmitButton>Add to bottom</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
