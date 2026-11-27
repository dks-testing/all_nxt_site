"use client";

import { useMemo, useState } from "react";
import { isValidDisabledDateRule } from "@platform/db/booking";

function tagLabel(rule: string) {
  const recurring = rule.startsWith("*-");
  const iso = recurring ? `2000-${rule.slice(2)}` : rule;
  const date = new Date(`${iso}T12:00:00`);
  const formatted = date.toLocaleDateString(undefined, recurring
    ? { month: "long", day: "numeric" }
    : { year: "numeric", month: "long", day: "numeric" });
  return `${formatted} · ${recurring ? "Every year" : "Selected year only"}`;
}

function sortRules(rules: string[]) {
  return [...rules].sort((a, b) => {
    const aKey = `${a.slice(-5)}-${a.startsWith("*-") ? "0" : a.slice(0, 4)}`;
    const bKey = `${b.slice(-5)}-${b.startsWith("*-") ? "0" : b.slice(0, 4)}`;
    return aKey.localeCompare(bKey);
  });
}

export function DisabledDatesEditor({ initial }: { initial: string[] }) {
  const [rules, setRules] = useState(() => sortRules([...new Set(initial.filter(isValidDisabledDateRule))]));
  const [date, setDate] = useState("");
  const [scope, setScope] = useState<"year" | "annual">("year");
  const [message, setMessage] = useState("");
  const serialized = useMemo(() => rules.join("\n"), [rules]);

  function addDate() {
    if (!date || !isValidDisabledDateRule(date)) {
      setMessage("Choose a valid date from the calendar.");
      return;
    }
    const monthDay = date.slice(5);
    const annualRule = `*-${monthDay}`;
    if (scope === "year" && rules.includes(annualRule)) {
      setMessage("This date is already disabled every year.");
      return;
    }
    const nextRule = scope === "annual" ? annualRule : date;
    if (rules.includes(nextRule)) {
      setMessage("This disabled date has already been added.");
      return;
    }
    setRules((current) => sortRules(scope === "annual"
      ? [...current.filter((rule) => rule.startsWith("*-") || rule.slice(5) !== monthDay), nextRule]
      : [...current, nextRule]));
    setDate("");
    setMessage("");
  }

  return (
    <fieldset className="sm:col-span-3 rounded-xl border border-slate-200 p-4">
      <legend className="label px-1">Disabled dates</legend>
      <input type="hidden" name="disabledDates" value={serialized} />
      <div className="grid gap-3 md:grid-cols-[minmax(190px,1fr)_minmax(190px,1fr)_auto] md:items-end">
        <label className="block"><span className="label">Select date</span><input className="input" type="date" value={date} onChange={(event) => { setDate(event.target.value); setMessage(""); }} /></label>
        <label className="block"><span className="label">Disable for</span><select className="input" value={scope} onChange={(event) => setScope(event.target.value as "year" | "annual")}><option value="year">Selected year only</option><option value="annual">Every year</option></select></label>
        <button type="button" className="btn btn-secondary min-h-10" onClick={addDate}>Add date</button>
      </div>
      {message && <p className="mt-2 text-sm text-rose-600" role="alert">{message}</p>}
      {rules.length > 0 ? <div className="mt-4 flex flex-wrap gap-2" aria-label="Disabled dates">{rules.map((rule) => <span key={rule} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"><span>{tagLabel(rule)}</span><button type="button" className="grid h-5 w-5 place-items-center rounded-full text-base leading-none text-slate-500 hover:bg-rose-100 hover:text-rose-700" onClick={() => setRules((current) => current.filter((item) => item !== rule))} aria-label={`Remove ${tagLabel(rule)}`}>×</button></span>)}</div> : <p className="mt-4 text-sm text-slate-500">No dates are currently disabled.</p>}
      <p className="help mt-3">Selected-year dates affect only that exact date. Every-year dates repeat annually, which is useful for holidays and recurring closures.</p>
    </fieldset>
  );
}
