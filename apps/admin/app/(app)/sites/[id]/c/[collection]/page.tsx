import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb, media, eq, asc, desc } from "@platform/db";
import { loadSite } from "@/lib/site";
import { collections } from "@/lib/collections";
import { saveCollectionItem, collectionOp } from "@/lib/actions/content";
import { PageHeader, Card, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/ConfirmButton";
import { CollectionFieldInput } from "@/components/CollectionFieldInput";

type Row = Record<string, unknown> & { id: string };

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ id: string; collection: string }>; searchParams: Promise<{ edit?: string; new?: string }> }) {
  const { id, collection } = await params;
  const { edit, new: isNew } = await searchParams;
  const def = collections[collection];
  if (!def) notFound();
  await loadSite(id, "EDITOR");
  const q = getDb().select().from(def.table).where(eq(def.table.siteId, id));
  const rows = (await (def.sortable ? q.orderBy(asc(def.table.sortOrder)) : q)) as Row[];
  const assets = await getDb().select({ id: media.id, url: media.url, alt: media.alt, width: media.width, height: media.height }).from(media).where(eq(media.siteId, id)).orderBy(desc(media.createdAt));
  const publicOrigin = (process.env.SITES_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const editing = edit ? rows.find((r) => r.id === edit) : undefined;
  const base = `/sites/${id}/c/${collection}`;
  const showForm = Boolean(editing || isNew);

  return (
    <>
      <PageHeader title={def.label} description={def.description} actions={!showForm && <Link href={`${base}?new=1`} className="btn btn-primary">+ Add {def.singular}</Link>} />

      {showForm && (
        <Card title={editing ? `Edit ${def.singular}` : `New ${def.singular}`} className="mb-6">
          <form action={saveCollectionItem} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="siteId" value={id} />
            <input type="hidden" name="collection" value={collection} />
            {editing && <input type="hidden" name="itemId" value={editing.id} />}
            {def.fields.map((f) => <CollectionFieldInput key={f.name} field={f} row={editing} siteId={id} assets={assets} publicOrigin={publicOrigin} />)}
            <div className="flex gap-2 sm:col-span-2">
              <SubmitButton>Save</SubmitButton>
              <Link href={base} className="btn btn-secondary">Cancel</Link>
            </div>
          </form>
        </Card>
      )}

      {rows.length === 0 ? (
        <Empty>No {def.label.toLowerCase()} yet.</Empty>
      ) : (
        <div className="card divide-y divide-slate-100">
          {rows.map((r) => (
            <div key={r.id} className={`flex items-center gap-3 px-4 py-3 ${r.id === edit ? "bg-indigo-50/50" : ""}`}>
              <div className="min-w-0 flex-1">
                <Link href={`${base}?edit=${r.id}`} className="font-semibold hover:text-[var(--color-brand)]">{String(r[def.title] ?? "(untitled)")}</Link>
                {def.subtitle && r[def.subtitle] != null && <p className="truncate text-xs text-slate-500">{String(r[def.subtitle])}</p>}
              </div>
              {"isActive" in r && !r.isActive && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">hidden</span>}
              <div className="flex gap-1">
                {def.sortable && (["up", "down"] as const).map((op) => (
                  <form key={op} action={collectionOp}>
                    <input type="hidden" name="siteId" value={id} /><input type="hidden" name="collection" value={collection} /><input type="hidden" name="itemId" value={r.id} /><input type="hidden" name="op" value={op} />
                    <SubmitButton className="btn btn-secondary btn-sm">{op === "up" ? "↑" : "↓"}</SubmitButton>
                  </form>
                ))}
                <Link href={`${base}?edit=${r.id}`} className="btn btn-secondary btn-sm">Edit</Link>
                <form action={collectionOp}>
                  <input type="hidden" name="siteId" value={id} /><input type="hidden" name="collection" value={collection} /><input type="hidden" name="itemId" value={r.id} /><input type="hidden" name="op" value="delete" />
                  <SubmitButton className="btn btn-danger btn-sm" confirm={`Delete this ${def.singular}?`}>Delete</SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
