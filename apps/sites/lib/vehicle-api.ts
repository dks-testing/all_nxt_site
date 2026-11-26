import type { BookingVehicleApiSettings } from "@platform/db";

const CAR_API_ORIGIN = "https://carapi.app/api";
const PLATE_TO_VIN_URL = "https://platetovin.com/api/convert";
const REQUEST_TIMEOUT_MS = 15_000;
const JWT_CACHE_MS = 6 * 24 * 60 * 60 * 1000;

type CachedJwt = { value: string; expiresAt: number };
const jwtCache = new Map<string, CachedJwt>();

export type VehicleOption = { value: string; label: string };
export type VehicleLookup = {
  vin: string;
  year: string;
  make: string;
  model: string;
  trim?: string;
};

export class VehicleApiError extends Error {
  constructor(public readonly code: "not_configured" | "not_found" | "unavailable") {
    super(code);
  }
}

function requiredCarApiCredentials(settings?: BookingVehicleApiSettings | null) {
  const apiToken = settings?.carApiToken?.trim();
  const apiSecret = settings?.carApiSecret?.trim();
  if (!apiToken || !apiSecret) throw new VehicleApiError("not_configured");
  return { apiToken, apiSecret, cacheKey: `${apiToken}\0${apiSecret}` };
}

function records(value: unknown): Record<string, unknown>[] {
  const rows = Array.isArray(value) ? value : value && typeof value === "object" && Array.isArray((value as { data?: unknown }).data) ? (value as { data: unknown[] }).data : [];
  return rows.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"));
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}

async function carApiJwt(settings?: BookingVehicleApiSettings | null, refresh = false) {
  const { apiToken, apiSecret, cacheKey } = requiredCarApiCredentials(settings);
  const cached = jwtCache.get(cacheKey);
  if (!refresh && cached && cached.expiresAt > Date.now()) return cached.value;

  let response: Response;
  try {
    response = await fetch(`${CAR_API_ORIGIN}/auth/login`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ api_token: apiToken, api_secret: apiSecret }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new VehicleApiError("unavailable");
  }
  if (!response.ok) throw new VehicleApiError("unavailable");
  let jwt = (await response.text()).trim();
  if (jwt.startsWith('"') && jwt.endsWith('"')) {
    try { jwt = JSON.parse(jwt) as string; } catch { /* use the raw response */ }
  }
  if (!jwt || jwt.length > 16_384) throw new VehicleApiError("unavailable");
  jwtCache.set(cacheKey, { value: jwt, expiresAt: Date.now() + JWT_CACHE_MS });
  return jwt;
}

async function carApiGet(path: string, settings: BookingVehicleApiSettings, query: Record<string, string>, retry = true): Promise<unknown> {
  const jwt = await carApiJwt(settings);
  const url = new URL(`${CAR_API_ORIGIN}${path}`);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { accept: "application/json", authorization: `Bearer ${jwt}` },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new VehicleApiError("unavailable");
  }
  if (response.status === 401 && retry) {
    await carApiJwt(settings, true);
    return carApiGet(path, settings, query, false);
  }
  if (!response.ok) throw new VehicleApiError("unavailable");
  try { return await response.json(); }
  catch { throw new VehicleApiError("unavailable"); }
}

export async function getVehicleMakes(year: string, settings: BookingVehicleApiSettings): Promise<VehicleOption[]> {
  const body = await carApiGet("/makes", settings, { year });
  const options = new Map<string, string>();
  for (const row of records(body)) {
    const value = text(row.id ?? row.make_id);
    const label = text(row.name ?? row.make);
    if (value && label) options.set(value, label);
  }
  return [...options].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
}

export async function getVehicleModels(year: string, makeId: string, settings: BookingVehicleApiSettings): Promise<VehicleOption[]> {
  const filters = [
    { field: "make_id", op: "=", val: Number(makeId) },
    { field: "year", op: "=", val: Number(year) },
  ];
  const body = await carApiGet("/models/v2", settings, { json: JSON.stringify(filters), limit: "1000" });
  const options = new Map<string, string>();
  for (const row of records(body)) {
    const label = text(row.name ?? row.model);
    if (label) options.set(label.toLocaleLowerCase(), label);
  }
  return [...options.values()].sort((a, b) => a.localeCompare(b)).map((label) => ({ value: label, label }));
}

export async function lookupLicensePlate(plate: string, state: string, settings: BookingVehicleApiSettings): Promise<VehicleLookup> {
  const token = settings.plateToVinToken?.trim();
  requiredCarApiCredentials(settings);
  if (!token) throw new VehicleApiError("not_configured");

  let plateResponse: Response;
  try {
    plateResponse = await fetch(PLATE_TO_VIN_URL, {
      method: "POST",
      headers: { accept: "application/json", authorization: token, "content-type": "application/json" },
      body: JSON.stringify({ plate: plate.replace(/\s+/g, "").toUpperCase(), state: state.toUpperCase() }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new VehicleApiError("unavailable");
  }
  if (!plateResponse.ok) throw new VehicleApiError(plateResponse.status === 404 ? "not_found" : "unavailable");
  let plateBody: unknown;
  try { plateBody = await plateResponse.json(); }
  catch { throw new VehicleApiError("unavailable"); }
  const plateRecord = plateBody && typeof plateBody === "object" ? plateBody as Record<string, unknown> : {};
  const vinRecord = plateRecord.vin && typeof plateRecord.vin === "object" ? plateRecord.vin as Record<string, unknown> : {};
  const vin = text(vinRecord.vin ?? plateRecord.vin).toUpperCase();
  if (plateRecord.success === false || !/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) throw new VehicleApiError("not_found");

  const vinBody = await carApiGet(`/vin/${encodeURIComponent(vin)}`, settings, { verbose: "no", all_trims: "no" });
  const vehicle = vinBody && typeof vinBody === "object" && !Array.isArray(vinBody)
    ? ((vinBody as { data?: unknown }).data && typeof (vinBody as { data?: unknown }).data === "object" ? (vinBody as { data: Record<string, unknown> }).data : vinBody as Record<string, unknown>)
    : {};
  const year = text(vehicle.year);
  const make = text(vehicle.make);
  const model = text(vehicle.model);
  if (!year || !make || !model) throw new VehicleApiError("not_found");
  return { vin: text(vehicle.vin).toUpperCase() || vin, year, make, model, trim: text(vehicle.trim) || undefined };
}
