"use client";

import { useState } from "react";

function parseDescription(value: string) {
  const paragraphs = value.trim().split(/\r?\n\s*\r?\n/).map((part) => part.trim()).filter(Boolean);
  const intro = paragraphs.length > 1 ? paragraphs[0] : "";
  const remainder = paragraphs.length > 1 ? paragraphs.slice(1).join("\n") : value.trim();
  const hasNewlines = /\r?\n/.test(remainder);
  const source = hasNewlines ? remainder : remainder.replace(/\.\s*(?=No upsells?\b|No pressure\b|Conditions apply\b)/gi, ", ");
  const items = (hasNewlines ? source.split(/\r?\n/) : source.split(/,\s*(?![^()]*\))/))
    .map((item) => item.trim().replace(/^(?:[•\-*]\s*)/, ""))
    .filter(Boolean);
  return { intro, items };
}

export function BulletListEditor({ name, label, value, help }: { name: string; label: string; value: string; help?: string }) {
  const initial = parseDescription(value);
  const [intro, setIntro] = useState(initial.intro);
  const [items, setItems] = useState(initial.items);
  const serialized = `${intro.trim() ? `${intro.trim()}\n\n` : ""}${items.map((item) => item.trim()).filter(Boolean).join("\n")}`;

  return (
    <div className="block sm:col-span-2">
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={serialized} />
      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Optional intro</span>
          <textarea value={intro} onChange={(event) => setIntro(event.target.value)} rows={2} className="input mt-1" />
        </label>
        <div>
          <span className="text-xs font-medium text-slate-600">Included items</span>
          {items.length > 0 && <ul className="mt-1 space-y-2">
            {items.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                <span aria-hidden="true" className="text-slate-500">•</span>
                <input aria-label={`Included item ${index + 1}`} value={item} onChange={(event) => setItems((current) => current.map((entry, i) => i === index ? event.target.value : entry))} className="input min-w-0 flex-1" />
                <button type="button" aria-label={`Remove included item ${index + 1}`} onClick={() => setItems((current) => current.filter((_, i) => i !== index))} className="btn btn-secondary btn-sm">Remove</button>
              </li>
            ))}
          </ul>}
          <button type="button" onClick={() => setItems((current) => [...current, ""])} className="btn btn-secondary btn-sm mt-2">+ Add bullet</button>
        </div>
      </div>
      {help && <p className="help">{help}</p>}
    </div>
  );
}
