"use client";

import { useState } from "react";
import type { BookingField } from "@platform/db";

const kinds: BookingField["type"][] = ["text", "email", "tel", "textarea", "select", "checkbox"];

export function BookingFieldsEditor({ initial }: { initial: BookingField[] }) {
  const [fields, setFields] = useState<BookingField[]>(initial);
  const update = (index: number, patch: Partial<BookingField>) =>
    setFields((prev) => prev.map((field, i) => i === index ? { ...field, ...patch } : field));
  const shift = (index: number, by: number) => setFields((prev) => {
    const next = [...prev]; const dest = index + by;
    if (dest < 0 || dest >= next.length) return next;
    [next[index], next[dest]] = [next[dest], next[index]];
    return next;
  });
  return (
    <div className="sm:col-span-3 rounded-lg border border-slate-200 p-4">
      <input type="hidden" name="formFields" value={JSON.stringify(fields)} />
      <div className="mb-3 flex items-center justify-between gap-3">
        <div><h3 className="font-semibold">Additional booking fields</h3>
          <p className="text-xs text-slate-500">The standard customer, vehicle and appointment fields remain. These extra fields are saved with each enquiry.</p></div>
        <button type="button" className="btn btn-secondary btn-sm" disabled={fields.length >= 24} onClick={() => setFields((prev) => [...prev, { key: `extra_${Date.now().toString(36)}`, label: "New question", type: "text", required: false }])}>Add field</button>
      </div>
      <div className="space-y-3">
        {fields.map((field, i) => <div key={i} className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block"><span className="label">Field key (internal)</span><input className="input" value={field.key} pattern="[a-z][a-z0-9_]*" maxLength={40} onChange={(e) => update(i, { key: e.target.value })} /></label>
            <label className="block"><span className="label">Visible label</span><input className="input" value={field.label} maxLength={100} onChange={(e) => update(i, { label: e.target.value })} /></label>
            <label className="block"><span className="label">Type</span><select className="input" value={field.type} onChange={(e) => update(i, { type: e.target.value as BookingField["type"], ...(e.target.value === "select" && !field.options?.length ? { options: ["Option one"] } : {}) })}>{kinds.map((k) => <option key={k} value={k}>{k}</option>)}</select></label>
            <label className="block md:col-span-2"><span className="label">Placeholder (optional)</span><input className="input" maxLength={160} value={field.placeholder ?? ""} onChange={(e) => update(i, { placeholder: e.target.value })} /></label>
            <label className="flex items-center gap-2 self-end"><input type="checkbox" checked={field.required ?? false} onChange={(e) => update(i, { required: e.target.checked })} /> Required</label>
            {field.type === "select" && <label className="block md:col-span-3"><span className="label">Options (one per line)</span><textarea className="input" rows={3} value={(field.options ?? []).join("\n")} onChange={(e) => update(i, { options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} /></label>}
          </div>
          <div className="mt-3 flex justify-end gap-2"><button type="button" className="btn btn-secondary btn-sm" onClick={() => shift(i, -1)} disabled={i === 0}>Up</button><button type="button" className="btn btn-secondary btn-sm" onClick={() => shift(i, 1)} disabled={i === fields.length - 1}>Down</button><button type="button" className="btn btn-danger btn-sm" onClick={() => setFields((prev) => prev.filter((_, n) => n !== i))}>Remove</button></div>
        </div>)}
      </div>
    </div>
  );
}
