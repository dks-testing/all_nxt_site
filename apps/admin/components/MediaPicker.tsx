"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type MediaAsset = { id: string; url: string; alt: string | null; width: number | null; height: number | null };

export function MediaPicker({ siteId, name, label, value = "", assets, publicOrigin, maxWidth = 1600, help, className = "", onChange, svgOnly = false, preserveSvg = false }: { siteId: string; name: string; label: string; value?: string; assets: MediaAsset[]; publicOrigin: string; maxWidth?: number; help?: string; className?: string; onChange?: (value: string) => void; svgOnly?: boolean; preserveSvg?: boolean }) {
  const [items, setItems] = useState(assets);
  const [selected, setSelected] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const hidden = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);
  const preview = (url: string) => url.startsWith("/") ? `${publicOrigin}${url}` : url;
  const current = useMemo(() => items.find((item) => item.url === selected), [items, selected]);
  const selectable = svgOnly ? items.filter((item) => /\.svg(?:\?|$)/i.test(item.url)) : items;
  useEffect(() => setSelected(value), [value]);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    hidden.current?.dispatchEvent(new Event("change", { bubbles: true }));
  }, [selected]);

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true); setError("");
    const fd = new FormData(); fd.set("file", file); fd.set("maxWidth", String(maxWidth)); fd.set("alt", label); if (svgOnly || (preserveSvg && (file.type === "image/svg+xml" || /\.svg$/i.test(file.name)))) fd.set("preserveSvg", "static");
    try {
      const response = await fetch(`/api/sites/${siteId}/media`, { method: "POST", body: fd });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      setItems((old) => [data.asset, ...old]); setSelected(data.asset.url); onChange?.(data.asset.url);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Upload failed"); }
    finally { setUploading(false); }
  }

  return <div className={`block ${className}`}>
    <span className="label">{label}</span><input ref={hidden} type="hidden" name={name} value={selected} />
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[110px_1fr]">
      <div className="grid aspect-video place-items-center overflow-hidden rounded border bg-white">{selected ? <img src={preview(selected)} alt={current?.alt ?? "Selected media"} className="h-full w-full object-contain" /> : <span className="text-xs text-slate-400">No image</span>}</div>
      <div className="space-y-2"><select className="input" value={selected} onChange={(event) => { setSelected(event.target.value); onChange?.(event.target.value); }}><option value="">No image</option>{selectable.map((item) => <option value={item.url} key={item.id}>{item.alt || item.url.split("/").at(-1)}{item.width ? ` (${item.width}×${item.height})` : ""}</option>)}</select><label className="btn btn-secondary btn-sm inline-flex cursor-pointer">{uploading ? "Uploading…" : svgOnly ? "Upload SVG" : "Upload new image"}<input type="file" accept={svgOnly ? "image/svg+xml,.svg" : "image/png,image/jpeg,image/webp,image/gif,image/tiff,image/avif,image/svg+xml,.tif,.tiff,.avif,.svg"} className="sr-only" disabled={uploading} onChange={(event) => upload(event.target.files?.[0])} /></label>{selected && <button type="button" className="btn btn-secondary btn-sm ml-2" onClick={() => { setSelected(""); onChange?.(""); }}>Remove</button>}</div>
    </div>
    <p className="help">{help || (svgOnly ? "Upload a safe, static SVG (maximum 512 KB). The original vector stays SVG." : preserveSvg ? `SVG logos stay as SVG; other uploads are optimized to WebP (maximum width ${maxWidth}px).` : `Uploads are automatically converted to WebP and sized to a maximum width of ${maxWidth}px.`)}</p>{error && <p className="mt-1 text-xs text-red-700">{error}</p>}
  </div>;
}
