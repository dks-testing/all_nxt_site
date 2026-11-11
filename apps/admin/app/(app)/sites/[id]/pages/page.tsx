import Link from "next/link";
import { getDb, pages, pageSections, eq, asc } from "@platform/db";
import { loadSite } from "@/lib/site";
import { createPage } from "@/lib/actions/content";
import { PageHeader, Card, Input } from "@/components/ui";
import { SubmitButton } from "@/components/ConfirmButton";

export default async function PagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await loadSite(id, "EDITOR");
  const db = getDb();
  const rows = await db.select().from(pages).where(eq(pages.siteId, id)).orderBy(asc(pages.sortOrder));
  const secs = await db.select({ pageId: pageSections.pageId }).from(pageSections).where(eq(pageSections.siteId, id));
  return (
    <>
      <PageHeader title="Pages" description="Each page is a stack of sections. Service detail pages are managed under Services." />
      <div className="card mb-6 overflow-x-auto">
        <table className="table">
          <thead><tr><th>Page</th><th>URL</th><th>Sections</th><th>Status</th><th>In menu</th><th /></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="font-semibold"><Link href={`/sites/${id}/pages/${p.id}`} className="hover:text-[var(--color-brand)]">{p.title}</Link></td>
                <td className="font-mono text-xs text-slate-500">/{p.slug}{p.slug ? "/" : ""}</td>
                <td>{secs.filter((s) => s.pageId === p.id).length}</td>
                <td>{p.status === "PUBLISHED" ? <span className="text-emerald-700">Published</span> : <span className="text-slate-500">Draft</span>}</td>
                <td>{p.showInNav ? "Yes" : "–"}</td>
                <td className="text-right"><Link href={`/sites/${id}/pages/${p.id}`} className="btn btn-secondary btn-sm">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card title="Add a page">
        <form action={createPage} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="siteId" value={id} />
          <Input label="Title" name="title" required className="w-64" />
          <Input label="URL slug" name="slug" placeholder="auto from title" className="w-64" />
          <SubmitButton>Add page</SubmitButton>
        </form>
      </Card>
    </>
  );
}
