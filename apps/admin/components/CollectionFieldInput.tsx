import type { CField } from "@/lib/collections";
import { BulletListEditor } from "./BulletListEditor";
import { MediaPicker, type MediaAsset } from "./MediaPicker";

type Row = Record<string, unknown> & { id: string };

function toInput(field: CField, value: unknown) {
  if (value === null || value === undefined) return "";
  if (field.kind === "datetime" && (value instanceof Date || typeof value === "string")) return new Date(value).toISOString().slice(0, 16);
  if (field.kind === "list" && Array.isArray(value)) return value.join("\n");
  return String(value);
}

export function CollectionFieldInput({ field, row, siteId, assets, publicOrigin }: {
  field: CField;
  row?: Row;
  siteId: string;
  assets: MediaAsset[];
  publicOrigin: string;
}) {
  const value = row?.[field.name];
  const className = field.wide || field.kind === "textarea" || field.kind === "list" ? "sm:col-span-2" : "";
  const help = field.help && <p className="help">{field.help}</p>;
  if (field.kind === "image") return <MediaPicker siteId={siteId} name={field.name} label={field.label} value={toInput(field, value)} assets={assets} publicOrigin={publicOrigin} maxWidth={field.name.toLowerCase().includes("logo") ? 600 : 1400} className={className} />;
  if (field.kind === "boolean") return <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={field.name} defaultChecked={row ? Boolean(value) : true} /> {field.label}</label>;
  if (field.kind === "select") return <label className={`block ${className}`}><span className="label">{field.label}</span><select name={field.name} defaultValue={toInput(field, value) || field.options?.[0]} className="input">{field.options?.map((option) => <option key={option}>{option}</option>)}</select>{help}</label>;
  if (field.name === "description" && field.kind === "textarea") return <BulletListEditor name={field.name} label={field.label} value={typeof value === "string" ? value : ""} help={field.help} />;
  if (field.kind === "textarea" || field.kind === "list") return <label className={`block ${className}`}><span className="label">{field.label}</span><textarea name={field.name} defaultValue={toInput(field, value)} rows={field.name === "body" ? 8 : 4} required={field.required} className="input" />{help}</label>;
  const type = { number: "number", date: "date", datetime: "datetime-local", url: "url" }[field.kind as string] ?? "text";
  return <label className={`block ${className}`}><span className="label">{field.label}</span><input name={field.name} type={type} defaultValue={toInput(field, value)} required={field.required} className="input" />{help}</label>;
}
