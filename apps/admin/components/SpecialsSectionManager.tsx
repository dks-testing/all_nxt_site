import { specials } from "@platform/db";
import { collections } from "@/lib/collections";
import { collectionOp, saveCollectionItem } from "@/lib/actions/content";
import { CollectionFieldInput } from "./CollectionFieldInput";
import { SubmitButton } from "./ConfirmButton";
import type { MediaAsset } from "./MediaPicker";

type Offer = typeof specials.$inferSelect;

export function SpecialsSectionManager({ siteId, pageId, sectionId, offers, assets, publicOrigin }: {
  siteId: string;
  pageId: string;
  sectionId: string;
  offers: Offer[];
  assets: MediaAsset[];
  publicOrigin: string;
}) {
  const returnTo = `/sites/${siteId}/pages/${pageId}?open=${sectionId}`;
  const fields = collections.specials.fields;
  const firstActiveId = offers.find((offer) => offer.isActive)?.id;

  return (
    <div className="space-y-4 border-t border-slate-100 p-5">
      <div>
        <h3 className="font-semibold">Offer cards</h3>
        <p className="mt-1 text-sm text-slate-500">Edit the content shown on the live Specials page. The first active offer is displayed full-width; save an offer to refresh the preview.</p>
      </div>
      {offers.map((offer) => (
        <details key={offer.id} className="rounded-lg border border-slate-200">
          <summary className="flex cursor-pointer flex-wrap items-center gap-2 p-3">
            <span className="min-w-0 flex-1 truncate font-semibold">{offer.title}</span>
            {offer.discount && <span className="text-sm text-slate-500">{offer.discount}</span>}
            {offer.id === firstActiveId && <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">Featured</span>}
            {!offer.isActive && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Hidden</span>}
          </summary>
          <div className="border-t border-slate-100 p-4">
            <form action={saveCollectionItem} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="siteId" value={siteId} />
              <input type="hidden" name="collection" value="specials" />
              <input type="hidden" name="itemId" value={offer.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              {fields.map((field) => <CollectionFieldInput key={field.name} field={field} row={offer} siteId={siteId} assets={assets} publicOrigin={publicOrigin} featured={offer.id === firstActiveId} />)}
              <div className="sm:col-span-2"><SubmitButton>Save offer</SubmitButton></div>
            </form>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {(["up", "down"] as const).map((op) => (
                <form key={op} action={collectionOp}>
                  <input type="hidden" name="siteId" value={siteId} />
                  <input type="hidden" name="collection" value="specials" />
                  <input type="hidden" name="itemId" value={offer.id} />
                  <input type="hidden" name="op" value={op} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <SubmitButton className="btn btn-secondary btn-sm">{op === "up" ? "↑ Move up" : "↓ Move down"}</SubmitButton>
                </form>
              ))}
              <form action={collectionOp}>
                <input type="hidden" name="siteId" value={siteId} />
                <input type="hidden" name="collection" value="specials" />
                <input type="hidden" name="itemId" value={offer.id} />
                <input type="hidden" name="op" value="delete" />
                <input type="hidden" name="returnTo" value={returnTo} />
                <SubmitButton className="btn btn-danger btn-sm" confirm="Delete this special offer?">Delete offer</SubmitButton>
              </form>
            </div>
          </div>
        </details>
      ))}
      {offers.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No offers yet. Add one to show a card on the live page.</p>}
      <details className="rounded-lg border border-dashed border-slate-300">
        <summary className="cursor-pointer p-3 font-semibold text-indigo-700">+ Add offer</summary>
        <form action={saveCollectionItem} className="grid gap-4 border-t border-slate-100 p-4 sm:grid-cols-2">
          <input type="hidden" name="siteId" value={siteId} />
          <input type="hidden" name="collection" value="specials" />
          <input type="hidden" name="returnTo" value={returnTo} />
          {fields.map((field) => <CollectionFieldInput key={field.name} field={field} siteId={siteId} assets={assets} publicOrigin={publicOrigin} featured={!offers.some((offer) => offer.isActive)} />)}
          <div className="sm:col-span-2"><SubmitButton>Add offer</SubmitButton></div>
        </form>
      </details>
    </div>
  );
}
