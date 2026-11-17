"use client";

import { useState } from "react";

const money = /\$\s*(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?\+?/g;

function parse(value: string) {
  const amounts = value.match(money) ?? [];
  return {
    now: amounts[0] ?? "",
    regular: amounts[1] ?? "",
    savings: value.match(/save\s+(\d+\s*%)/i)?.[1] ?? "",
  };
}

function amount(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("$") ? trimmed : `$${trimmed}`;
}

export function OfferDiscountInput({ name, label, value, help, featured = false }: {
  name: string;
  label: string;
  value: string;
  help?: string;
  featured?: boolean;
}) {
  const initial = parse(value);
  const [now, setNow] = useState(initial.now);
  const [regular, setRegular] = useState(initial.regular);
  const [savings, setSavings] = useState(initial.savings.replace(/\s+/g, ""));
  const currentPrice = amount(now);
  const regularPrice = amount(regular);
  const savingsText = savings.trim() ? `${savings.trim().replace(/%+$/, "")}%` : "";
  const discount = currentPrice
    ? `${currentPrice}${regularPrice || savingsText ? ` (${regularPrice ? `normally ${regularPrice}` : ""}${regularPrice && savingsText ? ", " : ""}${savingsText ? `save ${savingsText}` : ""})` : ""}`
    : "";

  return (
    <div className="block sm:col-span-2">
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={discount} />
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Now price</span>
          <input value={now} onChange={(event) => setNow(event.target.value)} placeholder="$149" pattern="\$?\s*(\d{1,3}(,\d{3})+|\d+)(\.\d{2})?\+?" required={Boolean(regular || savings)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Regular / value price</span>
          <input value={regular} onChange={(event) => setRegular(event.target.value)} placeholder="$350+" pattern="\$?\s*(\d{1,3}(,\d{3})+|\d+)(\.\d{2})?\+?" className="input mt-1" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Savings</span>
          <input value={savings} onChange={(event) => setSavings(event.target.value)} placeholder="60%" pattern="\d+\s*%?" className="input mt-1" />
        </label>
        <div className="rounded-md bg-slate-900 px-3 py-2 text-center text-sm font-black uppercase text-white sm:col-span-3">
          {regularPrice && <span>{regularPrice} {featured ? "VALUE." : "NORMALLY."} </span>}
          {currentPrice ? <span className="text-red-400">NOW {currentPrice}.</span> : <span className="text-slate-300">Enter a now price</span>}
          {savingsText && <span className="text-red-400"> SAVE {savingsText}</span>}
        </div>
      </div>
      {help && <p className="help">{help}</p>}
    </div>
  );
}
