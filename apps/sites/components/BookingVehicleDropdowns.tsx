"use client";

import { useEffect, useState } from "react";

type VehicleOption = { value: string; label: string };
type CatalogResult = { url: string; options: VehicleOption[] | null };
const catalogUrl = "/api/booking-vehicles/";
const latestYear = new Date().getUTCFullYear() + 1;
const years = Array.from({ length: latestYear - 1996 + 1 }, (_, index) => latestYear - index);

function useCatalog(url: string) {
  const [result, setResult] = useState<CatalogResult>();
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load vehicles");
        return response.json() as Promise<VehicleOption[]>;
      })
      .then((options) => {
        if (!controller.signal.aborted) setResult({ url, options });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ url, options: null });
      });
    return () => controller.abort();
  }, [url]);
  return result?.url === url ? result.options : undefined;
}

export function BookingVehicleDropdowns() {
  const [year, setYear] = useState("");
  const [makeId, setMakeId] = useState("");
  const [model, setModel] = useState("");
  const [manual, setManual] = useState(false);
  const makes = useCatalog(catalogUrl);
  const models = useCatalog(year && makeId && !manual ? `${catalogUrl}?year=${year}&make=${makeId}` : "");
  const makeName = makes?.find((option) => option.value === makeId)?.label ?? "";
  const catalogUnavailable = makes === null || models === null;

  if (manual) return <>
    <div className="book-manual-fields">
      <label><span>Year</span><input name="year" defaultValue={year} inputMode="numeric" pattern="[0-9]{4}" required /></label>
      <label><span>Make</span><input name="make" defaultValue={makeName} maxLength={64} required /></label>
      <label><span>Model</span><input name="model" defaultValue={model} maxLength={64} required /></label>
    </div>
    <button type="button" className="book-vehicle-catalog-link" onClick={() => setManual(false)}>Use vehicle dropdowns</button>
  </>;

  return <>
    <div className="book-manual-fields">
      <label>
        <span>Year</span>
        <select name="year" value={year} required onChange={(event) => {
          setYear(event.target.value);
          setModel("");
        }}>
          <option value="" disabled>Select year</option>
          {years.map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label>
        <span>Make</span>
        <select value={makeId} required onChange={(event) => {
          setMakeId(event.target.value);
          setModel("");
        }}>
          <option value="" disabled>{makes === undefined ? "Loading makes…" : "Select make"}</option>
          {makes?.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>
        <span>Model</span>
        <select name="model" value={model} required onChange={(event) => setModel(event.target.value)}>
          <option value="" disabled>{!year || !makeId ? "Choose year and make" : models === undefined ? "Loading models…" : models?.length ? "Select model" : "No models listed"}</option>
          {models?.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <input type="hidden" name="make" value={makeName} />
    </div>
    {catalogUnavailable && <p role="status">The vehicle catalog is unavailable. You can type your vehicle details below.</p>}
    <button type="button" className="book-vehicle-catalog-link" onClick={() => setManual(true)}>Enter vehicle details instead</button>
  </>;
}
