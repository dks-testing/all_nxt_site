"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { blockFields, type BlockType, type Field } from "@platform/db/blocks";

function setPath(object: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let current = object;
  for (const key of keys.slice(0, -1)) {
    if (!current[key] || typeof current[key] !== "object") current[key] = {};
    current = current[key] as Record<string, unknown>;
  }
  current[keys.at(-1)!] = value;
}

function readField(data: FormData, field: Field) {
  const name = `p:${field.path}`;
  const raw = String(data.get(name) ?? "");
  if (field.kind === "boolean") return data.has(name);
  if (field.kind === "number") return raw.trim() ? Number(raw) : undefined;
  if (field.kind === "list") return raw.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  if (field.kind === "pairs") return raw.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).map((item) => {
    const [first, ...rest] = item.split("|");
    return { [field.keys[0]]: first.trim(), [field.keys[1]]: rest.join("|").trim() };
  });
  return raw.trim() || undefined;
}

function propsFromForm(form: HTMLFormElement, type: BlockType) {
  const data = new FormData(form);
  const props: Record<string, unknown> = {};
  for (const field of blockFields[type]) {
    const value = readField(data, field);
    if (value !== undefined) setPath(props, field.path, value);
  }
  for (const [key, value] of Object.entries(props)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const link = value as Record<string, unknown>;
      if (("label" in link || "href" in link) && !link.label && !link.href) delete props[key];
    }
  }
  return props;
}

function PreviewFrame({ src, mode }: { src: string; mode: "desktop" | "tablet" | "mobile" }) {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const target = mode === "desktop" ? 1280 : mode === "tablet" ? 768 : 390;
  const scale = Math.min(1, width / target);
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={host} className="overflow-hidden border border-slate-200 rounded-lg shadow-sm bg-white" style={{ height: 720 * scale }}>
    <iframe title={`${mode} live section preview`} src={src} style={{ width: target, height: 720, transform: `scale(${scale})`, transformOrigin: "top left", border: 0 }} />
  </div>;
}

export function SectionEditor({ action, type, sectionId, previewBaseUrl, initialProps, visible, hidden, hint, children }: {
  action: (data: FormData) => void | Promise<void>;
  type: BlockType;
  sectionId: string;
  previewBaseUrl: string;
  initialProps: Record<string, unknown>;
  visible: boolean;
  hidden: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState(initialProps);
  const [mode, setMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  useEffect(() => {
    if (!revision || !form.current) return;
    const timer = setTimeout(() => setDraft(propsFromForm(form.current!, type)), 280);
    return () => clearTimeout(timer);
  }, [revision, type]);
  const src = useMemo(() => {
    const url = new URL(previewBaseUrl);
    url.searchParams.set("sectionPreview", sectionId);
    url.searchParams.set("sectionOnly", "1");
    url.searchParams.set("sectionProps", JSON.stringify(draft));
    return url.toString();
  }, [draft, previewBaseUrl, sectionId]);
  const changed = () => setRevision((value) => value + 1);
  return <form ref={form} action={action} className="border-t border-slate-100 p-5" onInput={changed} onChange={changed}>
    {hidden}
    {hint}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,1fr)]">
      <div className="min-w-0">{children}</div>
      <aside className="min-w-0 xl:sticky xl:top-24">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">Live Preview</p><p className="text-xs text-slate-500">Unsaved changes · actual website component</p></div><div className="flex rounded-lg bg-slate-100 p-1">{(["desktop", "tablet", "mobile"] as const).map((item) => <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold capitalize ${mode === item ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}>{item}</button>)}</div></div>
        <PreviewFrame src={src} mode={mode} />
      </aside>
    </div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isVisible" defaultChecked={visible} onChange={changed} /> Visible</label>
      <div className="flex gap-2"><button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>Cancel changes</button><button className="btn btn-primary">Save section</button></div>
    </div>
  </form>;
}
