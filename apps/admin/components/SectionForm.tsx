"use client";

import { useState } from "react";
import { blockFields, type BlockType, type Field } from "@platform/db/blocks";
import { MediaPicker, type MediaAsset } from "./MediaPicker";

function get(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
}

type Group = "Content" | "Design" | "Images" | "Buttons" | "Advanced";
function fieldGroup(field: Field): Group {
  if (field.kind === "image") return "Images";
  if (/cta|button/i.test(field.path)) return "Buttons";
  if (/variant|layout|showRating|badges/i.test(field.path) || field.kind === "boolean" || field.kind === "select") return "Design";
  if (field.kind === "url" || /integration|height/i.test(field.path)) return "Advanced";
  return "Content";
}

function FieldInput({ f, value, siteId, media, publicOrigin, changed }: { f: Field; value: unknown; siteId: string; media: MediaAsset[]; publicOrigin: string; changed: () => void }) {
  const name = `p:${f.path}`;
  const wide = f.kind === "textarea" || f.kind === "list" || f.kind === "pairs";
  const cls = wide ? "sm:col-span-2" : "";
  switch (f.kind) {
    case "image":
      return <MediaPicker siteId={siteId} name={name} label={f.label} value={String(value ?? "")} assets={media} publicOrigin={publicOrigin} maxWidth={f.path.includes("Logo") ? 600 : 1920} className={cls} onChange={changed} />;
    case "boolean":
      return <label className={`flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm ${cls}`}><input type="checkbox" name={name} defaultChecked={Boolean(value)} onChange={changed} /> <span>{f.label}</span></label>;
    case "select":
      return <label className={`block ${cls}`}><span className="label">{f.label}</span><select name={name} defaultValue={String(value ?? f.options[0])} className="input" onChange={changed}>{f.options.map((o) => <option key={o}>{o}</option>)}</select></label>;
    case "textarea":
      return <label className={`block ${cls}`}><span className="label">{f.label}</span><textarea name={name} defaultValue={String(value ?? "")} rows={5} className="input" onInput={changed} /></label>;
    case "list":
      return <label className={`block ${cls}`}><span className="label">{f.label}</span><textarea name={name} defaultValue={Array.isArray(value) ? value.join("\n") : ""} rows={4} className="input" onInput={changed} />{f.help && <p className="help">{f.help}</p>}</label>;
    case "pairs": {
      const v = Array.isArray(value) ? (value as Record<string, string>[]).map((o) => `${o[f.keys[0]] ?? ""} | ${o[f.keys[1]] ?? ""}`).join("\n") : "";
      return <label className={`block ${cls}`}><span className="label">{f.label}</span><textarea name={name} defaultValue={v} rows={5} className="input" onInput={changed} />{f.help && <p className="help">{f.help}</p>}</label>;
    }
    default:
      return <label className={`block ${cls}`}><span className="label">{f.label}</span><input name={name} type={f.kind === "number" ? "number" : "text"} defaultValue={value === undefined || value === null ? "" : String(value)} className="input" onInput={changed} /></label>;
  }
}

export function SectionFields({ type, props, siteId, media, publicOrigin, onChange }: { type: BlockType; props: Record<string, unknown>; siteId: string; media: MediaAsset[]; publicOrigin: string; onChange?: () => void }) {
  // These legacy page-level fields are intentionally hidden: certification artwork
  // is now managed once per website in Branding, not independently per section.
  const fields = blockFields[type].filter((field) => !(
    (type === "hero" && field.path.startsWith("certificationLogos")) ||
    (type === "about" && field.path.startsWith("certificationLogoUrl"))
  ));
  const groups = (["Content", "Design", "Images", "Buttons", "Advanced"] as Group[]).filter((group) => fields.some((field) => fieldGroup(field) === group));
  const [active, setActive] = useState<Group>(groups[0] ?? "Content");
  const changed = onChange ?? (() => undefined);
  return <div>
    {(type === "hero" || type === "about") && <p className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-800">Certification logos are shared across this website. Change or hide them in <a href={`/sites/${siteId}/branding`} className="font-semibold underline">Branding → Certification badges</a>.</p>}
    <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Section settings">
      {groups.map((group) => <button key={group} type="button" role="tab" aria-selected={active === group} onClick={() => setActive(group)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${active === group ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>{group}</button>)}
    </div>
    {groups.map((group) => <div key={group} className={`grid gap-4 sm:grid-cols-2 ${active === group ? "" : "hidden"}`} aria-hidden={active !== group}>
      {fields.filter((field) => fieldGroup(field) === group).map((f) => <FieldInput key={f.path} f={f} value={get(props, f.path)} siteId={siteId} media={media} publicOrigin={publicOrigin} changed={changed} />)}
    </div>)}
    {active === "Advanced" && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Advanced settings can affect layout or third-party integrations. Change them only when needed.</p>}
  </div>;
}
