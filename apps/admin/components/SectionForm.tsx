"use client";

import { useRef, useState } from "react";
import { blockFields, splitLegacyOffer, type BlockType, type Field } from "@platform/db/blocks";
import { MediaPicker, type MediaAsset } from "./MediaPicker";
import { PairListEditor } from "./PairListEditor";
import { RichTextEditor } from "./RichTextEditor";

function get(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
}

type Group = "Content" | "Design" | "Images" | "Buttons" | "Advanced";
export type TeamProfileOption = { id: string; name: string; position: string | null; imageUrl: string | null; isActive: boolean };

function TeamProfilePicker({ value, profiles, publicOrigin, siteId, changed }: { value: unknown; profiles: TeamProfileOption[]; publicOrigin: string; siteId: string; changed: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const initial = Array.isArray(value) ? value.map(String).filter((id) => profiles.some((profile) => profile.id === id)) : [];
  const [selected, setSelected] = useState(initial);
  const preview = (url: string) => url.startsWith("/") ? `${publicOrigin}${url}` : url;
  const notifyPreview = () => {
    changed();
    setTimeout(() => host.current?.dispatchEvent(new Event("input", { bubbles: true })), 0);
  };
  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    notifyPreview();
  };
  const move = (id: string, direction: -1 | 1) => {
    setSelected((current) => {
      const next = [...current];
      const from = next.indexOf(id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= next.length) return current;
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
    notifyPreview();
  };
  const ordered = [...selected.map((id) => profiles.find((profile) => profile.id === id)).filter(Boolean), ...profiles.filter((profile) => !selected.includes(profile.id))] as TeamProfileOption[];
  return <div ref={host} className="sm:col-span-2">
    <div className="mb-2 flex items-center justify-between gap-3"><span className="label">Team members shown on this page</span><a href={`/sites/${siteId}/c/our-team`} className="text-xs font-semibold text-indigo-700 underline">Manage Our Team</a></div>
    {selected.map((id) => <input key={id} type="hidden" name="p:teamMemberIds" value={id} />)}
    {profiles.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">No team profiles yet. Add them in <strong>Our Team</strong>, then return here to select them.</p> : <div className="space-y-2">
      {ordered.map((profile) => {
        const checked = selected.includes(profile.id);
        const position = selected.indexOf(profile.id);
        return <div key={profile.id} className={`flex items-center gap-3 rounded-lg border p-2 ${checked ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white"}`}>
          <input type="checkbox" checked={checked} onChange={() => toggle(profile.id)} aria-label={`Show ${profile.name}`} />
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-slate-100">{profile.imageUrl && <img src={preview(profile.imageUrl)} alt="" className="h-full w-full object-cover" />}</div>
          <div className="min-w-0 flex-1"><strong className="block truncate text-sm">{profile.name}</strong><span className="block truncate text-xs text-slate-500">{profile.position || "No position set"}{!profile.isActive ? " · hidden profile" : ""}</span></div>
          {checked && <div className="flex gap-1"><button type="button" className="btn btn-secondary btn-sm" onClick={() => move(profile.id, -1)} disabled={position === 0} aria-label={`Move ${profile.name} up`}>↑</button><button type="button" className="btn btn-secondary btn-sm" onClick={() => move(profile.id, 1)} disabled={position === selected.length - 1} aria-label={`Move ${profile.name} down`}>↓</button></div>}
        </div>;
      })}
    </div>}
    <p className="help">Selected members appear first in their page-specific order. Profile photos, headings, positions, and descriptions come from Our Team.</p>
  </div>;
}

function fieldGroup(field: Field): Group {
  if (field.path === "headingTag") return "Content";
  if (field.kind === "image" || field.kind === "image-list") return "Images";
  if (/cta|button|reviewUrl/i.test(field.path)) return "Buttons";
  if (/variant|layout|showRating|badges/i.test(field.path) || field.kind === "boolean" || field.kind === "select") return "Design";
  if (field.kind === "url" || /integration|height/i.test(field.path)) return "Advanced";
  return "Content";
}

type RichTextItem = { heading: string; headingTag: string; body: string };
const richTextHeadingTags = ["h1", "h2", "h3", "h4", "h5", "h6", "strong", "b"];

function richTextItems(value: unknown): RichTextItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      heading: typeof row.heading === "string" ? row.heading : "",
      headingTag: typeof row.headingTag === "string" ? row.headingTag : "h2",
      body: typeof row.body === "string" ? row.body : "",
    };
  });
}

function initialRichTextItems(value: unknown, props: Record<string, unknown>): RichTextItem[] {
  if (Array.isArray(value)) return richTextItems(value);
  const heading = typeof props.heading === "string" ? props.heading : "";
  return [{
    heading,
    headingTag: heading ? String(props.headingTag ?? "h1") : "h2",
    body: typeof props.body === "string" ? props.body : "",
  }];
}

function RichTextItemsEditor({ name, label, value, siteId, publicOrigin, help, changed }: { name: string; label: string; value: RichTextItem[]; siteId: string; publicOrigin: string; help?: string; changed: () => void }) {
  const [items, setItems] = useState(() => value.map((item, id) => ({ ...item, id })));
  const nextId = useRef(value.length);
  const group = useRef<HTMLDivElement>(null);

  function addItem() {
    const id = nextId.current++;
    setItems((current) => [...current, { id, heading: "", headingTag: "h2", body: "" }]);
    changed();
  }

  return <div ref={group} className="sm:col-span-2">
    <div className="mb-2 flex items-center justify-between gap-3">
      <span className="label">{label}</span>
      <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add heading and text</button>
    </div>
    {help && <p className="help mb-3">{help}</p>}
    <div className="space-y-4">
      {items.map((item, index) => (
        <fieldset key={item.id} className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
          <legend className="px-1 text-xs font-semibold text-slate-500">Content section {index + 1}</legend>
          <label className="block"><span className="label">Heading</span><input name={`${name}.heading`} defaultValue={item.heading} onInput={changed} className="input" /></label>
          <label className="block"><span className="label">Heading tag</span><select name={`${name}.headingTag`} defaultValue={item.headingTag} onChange={changed} className="input">{richTextHeadingTags.map((tag) => <option key={tag}>{tag}</option>)}</select></label>
          <RichTextEditor name={`${name}.body`} label="Body" value={item.body} siteId={siteId} publicOrigin={publicOrigin} className="sm:col-span-2" />
          <div className="sm:col-span-2"><button type="button" className="btn btn-danger btn-sm" onClick={() => {
            setItems((current) => current.filter(({ id }) => id !== item.id));
            changed();
            group.current?.dispatchEvent(new Event("input", { bubbles: true }));
          }}>Remove section</button></div>
        </fieldset>
      ))}
    </div>
  </div>;
}

function FieldInput({ f, value, siteId, media, publicOrigin, changed, imageCount, imageLabels, onCrewCountChange, teamProfiles }: { f: Field; value: unknown; siteId: string; media: MediaAsset[]; publicOrigin: string; changed: () => void; imageCount?: number; imageLabels?: string[]; onCrewCountChange?: (count: number) => void; teamProfiles: TeamProfileOption[] }) {
  const name = `p:${f.path}`;
  const wide = f.kind === "textarea" || f.kind === "rich-text" || f.kind === "list" || f.kind === "pairs" || f.kind === "rich-text-items";
  const cls = wide ? "sm:col-span-2" : "";
  switch (f.kind) {
    case "image":
      return <MediaPicker siteId={siteId} name={name} label={f.label} value={String(value ?? "")} assets={media} publicOrigin={publicOrigin} maxWidth={f.path.includes("Logo") ? 600 : 1920} className={cls} onChange={changed} />;
    case "image-list":
      return <div className={`block ${cls}`}><span className="label">{f.label}</span><div className="mt-2 grid gap-4 sm:grid-cols-2">{Array.from({ length: imageCount ?? (Array.isArray(value) ? value.length : 0) }, (_, index) => <MediaPicker key={`${f.path}-${index}`} siteId={siteId} name={name} label={imageLabels?.[index] || `Crew photo ${index + 1}`} value={String(Array.isArray(value) ? value[index] ?? "" : "")} assets={media} publicOrigin={publicOrigin} maxWidth={900} onChange={changed} />)}</div>{f.help && <p className="help">{f.help}</p>}</div>;
    case "team":
      return <TeamProfilePicker value={value} profiles={teamProfiles} publicOrigin={publicOrigin} siteId={siteId} changed={changed} />;
    case "boolean":
      return <label className={`flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm ${cls}`}><input type="checkbox" name={name} defaultChecked={Boolean(value)} onChange={changed} /> <span>{f.label}</span></label>;
    case "select":
      return <label className={`block ${cls}`}><span className="label">{f.label}</span><select name={name} defaultValue={String(value ?? f.options[0])} className="input" onChange={changed}>{f.options.map((o) => <option key={o}>{o}</option>)}</select></label>;
    case "textarea":
      return <label className={`block ${cls}`}><span className="label">{f.label}</span><textarea name={name} defaultValue={String(value ?? "")} rows={5} className="input" onInput={changed} /></label>;
    case "rich-text":
      return <RichTextEditor name={name} label={f.label} value={String(value ?? "")} siteId={siteId} publicOrigin={publicOrigin} className={cls} />;
    case "list":
      return <label className={`block ${cls}`}><span className="label">{f.label}</span><textarea name={name} defaultValue={Array.isArray(value) ? value.join("\n") : ""} rows={4} className="input" onInput={changed} />{f.help && <p className="help">{f.help}</p>}</label>;
    case "pairs": {
      const pairs = Array.isArray(value) ? value as Record<string, string>[] : [];
      return <PairListEditor name={name} label={f.label} value={pairs} keys={f.keys} help={f.help} />;
    }
    case "rich-text-items":
      return <RichTextItemsEditor name={name} label={f.label} value={richTextItems(value)} siteId={siteId} publicOrigin={publicOrigin} help={f.help} changed={changed} />;
    default:
      return <label className={`block ${cls}`}><span className="label">{f.label}</span><input name={name} type={f.kind === "number" ? "number" : "text"} defaultValue={value === undefined || value === null ? "" : String(value)} className="input" onInput={changed} />{f.help && <p className="help">{f.help}</p>}</label>;
  }
}

export function SectionFields({ type, props, siteId, media, publicOrigin, teamProfiles = [], isHomePage = false, hideHeroDesign = false, onChange }: { type: BlockType; props: Record<string, unknown>; siteId: string; media: MediaAsset[]; publicOrigin: string; teamProfiles?: TeamProfileOption[]; isHomePage?: boolean; hideHeroDesign?: boolean; onChange?: () => void }) {
  // These legacy page-level fields are intentionally hidden: certification artwork
  // is now managed once per website in Branding, not independently per section.
  const fields = blockFields[type].filter((field) => !(
    (type === "hero" && field.path.startsWith("certificationLogos")) ||
    (type === "about" && field.path.startsWith("certificationLogoUrl")) ||
    (type === "hero" && !isHomePage && (field.path === "subheading" || /^(primary|secondary|tertiary)Cta\./.test(field.path))) ||
    (type === "hero" && hideHeroDesign && fieldGroup(field) === "Design")
  ));
  const fieldProps = type === "embed" ? splitLegacyOffer(props) as Record<string, unknown> : props;
  const groups = (["Content", "Design", "Images", "Buttons", "Advanced"] as Group[]).filter((group) => fields.some((field) => fieldGroup(field) === group));
  const [active, setActive] = useState<Group>(groups[0] ?? "Content");
  const [crewCount, setCrewCount] = useState(Array.isArray(props.crew) ? props.crew.length : 0);
  const crew = Array.isArray(props.crew) ? props.crew as { title?: string }[] : [];
  const changed = onChange ?? (() => undefined);
  return <div>
    {type === "reviews" && <p className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-800">Manage the Testimonials page Facebook and Google review links in the <strong>Buttons</strong> tab. A badge with an empty URL stays visible but is inactive.</p>}
    {fields.some((field) => /cta|button/i.test(field.path)) && <p className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">Schedule, diagnostics, tires, About Us, Services, and Call actions use their shared label and link from <a href={`/sites/${siteId}/global`} className="font-semibold underline">Global settings → Global website buttons</a>. Section fields remain available for genuinely custom actions.</p>}
    {(type === "hero" || type === "about") && <p className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-800">Certification logos are shared across this website. Change or hide them in <a href={`/sites/${siteId}/branding`} className="font-semibold underline">Branding → Certification badges</a>.</p>}
    <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Section settings">
      {groups.map((group) => <button key={group} type="button" role="tab" aria-selected={active === group} onClick={() => setActive(group)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${active === group ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>{group}</button>)}
    </div>
    {groups.map((group) => <div key={group} className={`grid gap-4 sm:grid-cols-2 ${active === group ? "" : "hidden"}`} aria-hidden={active !== group}>
      {fields.filter((field) => fieldGroup(field) === group).map((f) => {
        const fallback = type === "specials" && f.path === "heading"
          ? "Featured Offers & Specials"
          : type === "embed" && props.variant === "micks-ai" && f.path === "toolDescription"
            ? "Try our AI diagnostic tool for an instant initial check before coming in.\nFree, efficient, and time-saving."
            : undefined;
        const fieldValue = type === "rich_text" && f.kind === "rich-text-items"
          ? initialRichTextItems(get(fieldProps, f.path), props)
          : get(fieldProps, f.path) ?? fallback;
        return <FieldInput key={f.path} f={f} value={fieldValue} siteId={siteId} media={media} publicOrigin={publicOrigin} changed={changed} imageCount={crewCount} imageLabels={crew.map((member, index) => member.title || `Crew photo ${index + 1}`)} onCrewCountChange={setCrewCount} teamProfiles={teamProfiles} />;
      })}
    </div>)}
    {active === "Advanced" && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Advanced settings can affect layout or third-party integrations. Change them only when needed.</p>}
  </div>;
}
