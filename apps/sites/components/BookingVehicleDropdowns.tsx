"use client";

import { useEffect, useState } from "react";

type VehicleOption = { value: string; label: string };
type CatalogResult = { url: string; options: VehicleOption[] | null };
const catalogUrl = "/api/booking-vehicles/";
const latestYear = new Date().getUTCFullYear() + 1;
const years = Array.from({ length: latestYear - 1980 + 1 }, (_, index) => latestYear - index);

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

export function BookingVehicleDropdowns({ siteSlug }: { siteSlug: string }) {
  const [year, setYear] = useState("");
  const [makeId, setMakeId] = useState("");
  const [model, setModel] = useState("");
  const site = encodeURIComponent(siteSlug);
  const makes = useCatalog(year ? `${catalogUrl}?site=${site}&year=${year}` : "");
  const models = useCatalog(year && makeId ? `${catalogUrl}?site=${site}&year=${year}&make=${encodeURIComponent(makeId)}` : "");
  const makeName = makes?.find((option) => option.value === makeId)?.label ?? "";
  const catalogUnavailable = makes === null || models === null;

  return <>
    <div className="book-manual-fields">
      <label>
        <span>Year</span>
        <select name="year" value={year} required onChange={(event) => {
          setYear(event.target.value);
          setMakeId("");
          setModel("");
        }}>
          <option value="" disabled>Select year</option>
          {years.map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label>
        <span>Make</span>
        <select value={makeId} required disabled={!year || makes === undefined || makes === null} onChange={(event) => {
          setMakeId(event.target.value);
          setModel("");
        }}>
          <option value="" disabled>{!year ? "Choose year" : makes === undefined ? "Loading makes…" : "Select make"}</option>
          {makes?.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>
        <span>Model</span>
        <select name="model" value={model} required disabled={!year || !makeId || models === undefined || models === null} onChange={(event) => setModel(event.target.value)}>
          <option value="" disabled>{!year || !makeId ? "Choose year and make" : models === undefined ? "Loading models…" : models?.length ? "Select model" : "No models listed"}</option>
          {models?.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <input type="hidden" name="make" value={makeName} />
    </div>
    {catalogUnavailable && <p role="status">Vehicle options are temporarily unavailable.</p>}
  </>;
}
