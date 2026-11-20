"use client";

import { useRef, useState } from "react";

type Pair = Record<string, string>;

export function PairListEditor({ name, label, value, keys, help }: {
  name: string;
  label: string;
  value: Pair[];
  keys: [string, string];
  help?: string;
}) {
  const [items, setItems] = useState<Pair[]>(value);
  const hidden = useRef<HTMLInputElement>(null);
  const notify = () => setTimeout(() => hidden.current?.dispatchEvent(new Event("input", { bubbles: true })), 0);
  const update = (index: number, key: string, next: string) => {
    setItems((current) => current.map((item, position) => position === index ? { ...item, [key]: next } : item));
    notify();
  };
  const move = (index: number, direction: -1 | 1) => {
    setItems((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    notify();
  };
  const remove = (index: number) => {
    setItems((current) => current.filter((_, position) => position !== index));
    notify();
  };
  const serialized = items.map((item) => `${item[keys[0]] || ""} | ${item[keys[1]] || ""}`).join("\n");
  return <div className="sm:col-span-2">
    <span className="label">{label}</span>
    <input ref={hidden} type="hidden" name={name} value={serialized} />
    <div className="mt-2 space-y-2">
      {items.map((item, index) => <div key={index} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[24px_1fr_1.5fr_auto] sm:items-start">
        <span className="pt-2 text-center text-xl font-black text-indigo-500" aria-hidden="true">•</span>
        <label><span className="text-xs font-semibold text-slate-500">Heading</span><input className="input mt-1" value={item[keys[0]] || ""} onChange={(event) => update(index, keys[0], event.target.value)} /></label>
        <label><span className="text-xs font-semibold text-slate-500">Description</span><textarea className="input mt-1" rows={2} value={item[keys[1]] || ""} onChange={(event) => update(index, keys[1], event.target.value)} /></label>
        <div className="flex gap-1 pt-5"><button type="button" className="btn btn-secondary btn-sm" onClick={() => move(index, -1)} disabled={index === 0}>↑</button><button type="button" className="btn btn-secondary btn-sm" onClick={() => move(index, 1)} disabled={index === items.length - 1}>↓</button><button type="button" className="btn btn-danger btn-sm" onClick={() => remove(index)}>×</button></div>
      </div>)}
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setItems((current) => [...current, { [keys[0]]: "", [keys[1]]: "" }]); notify(); }}>+ Add point</button>
    </div>
    {help && <p className="help">{help}</p>}
  </div>;
}
