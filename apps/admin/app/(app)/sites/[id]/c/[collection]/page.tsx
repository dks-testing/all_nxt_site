import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb, media, eq, asc, desc } from "@platform/db";
import { loadSite } from "@/lib/site";
import { collections, type CField } from "@/lib/collections";
import { saveCollectionItem, collectionOp } from "@/lib/actions/content";
import { PageHeader, Card, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/ConfirmButton";
import { MediaPicker, type MediaAsset } from "@/components/MediaPicker";

type Row = Record<string, unknown> & { id: string };

function toInput(f: CField, v: unknown) {
  if (v === null || v === undefined) return "";
  if (f.kind === "datetime" && (v instanceof Date || typeof v === "string")) return new Date(v).toISOString().slice(0, 16);
  if (f.kind === "list" && Array.isArray(v)) return v.join("\n");
  return String(v);
}

function FieldInput({ f, row, siteId, assets, publicOrigin }: { f: CField; row?: Row; siteId: string; assets: MediaAsset[]; publicOrigin: string }) {
  const v = row?.[f.name];
  const cls = f.wide || f.kind === "textarea" || f.kind === "list" ? "sm:col-span-2" : "";
  const help = f.help && <p className="help">{f.help}</p>;
  if (f.kind === "image") return <MediaPicker siteId={siteId} name={f.name} label={f.label} value={toInput(f, v)} assets={assets} publicOrigin={publicOrigin} maxWidth={collectionWidth(f.name)} className={cls} />;
  if (f.kind === "boolean") return <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={f.name} defaultChecked={row ? Boolean(v) : true} /> {f.label}</label>;
  if (f.kind === "select") return <label className={`block ${cls}`}><span className="label">{f.label}</span><select name={f.name} defaultValue={toInput(f, v) || f.options?.[0]} className="input">{f.options?.map((o) => <option key={o}>{o}</option>)}</select>{help}</label>;
  if (f.kind === "textarea" || f.kind === "list") return <label className={`block ${cls}`}><span className="label">{f.label}</span><textarea name={f.name} defaultValue={toInput(f, v)} rows={f.name === "body" ? 8 : 4} required={f.required} className="input" />{help}</label>;
  const type = { number: "number", date: "date", datetime: "datetime-local", url: "url" }[f.kind as string] ?? "text";
  return <label className={`block ${cls}`}><span className="label">{f.label}</span><input name={f.name} type={type} defaultValue={toInput(f, v)} required={f.required} className="input" />{help}</label>;
}

const collectionWidth = (name: string) => name.toLowerCase().includes("logo") ? 600 : 1400;

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
            {def.fields.map((f) => <FieldInput key={f.name} f={f} row={editing} siteId={id} assets={assets} publicOrigin={publicOrigin} />)}
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
