import { NextResponse } from "next/server";
import { bookingSettings, eq, getDb, resolveHost, resolveSiteSlug } from "@platform/db";
import { getVehicleMakes, getVehicleModels, VehicleApiError, type VehicleOption } from "@/lib/vehicle-api";

export const dynamic = "force-dynamic";
const catalogCache = new Map<string, { expiresAt: number; options: VehicleOption[] }>();

async function requestSite(request: Request, requestedSlug: string | null) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const isLocal = process.env.NODE_ENV === "development" && /^(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(host);
  return isLocal && requestedSlug ? resolveSiteSlug(requestedSlug) : resolveHost(host);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const year = params.get("year") ?? "";
  const make = params.get("make") ?? "";
  const site = await requestSite(request, params.get("site"));
  if (!site || site.status !== "PUBLISHED") return NextResponse.json({ error: "Site not found." }, { status: 404 });

  const currentYear = new Date().getUTCFullYear() + 1;
  if (!/^\d{4}$/.test(year) || Number(year) < 1980 || Number(year) > currentYear || (make && !/^[1-9]\d{0,9}$/.test(make))) {
    return NextResponse.json({ error: "Choose a valid model year and make." }, { status: 400 });
  }

  const [booking] = await getDb()
    .select({ vehicleApi: bookingSettings.vehicleApi })
    .from(bookingSettings)
    .where(eq(bookingSettings.siteId, site.siteId))
    .limit(1);
  const settings = booking?.vehicleApi;
  if (!settings?.carApiToken?.trim() || !settings.carApiSecret?.trim()) {
    return NextResponse.json({ error: "Vehicle lookup is not configured." }, { status: 503 });
  }

  try {
    const cacheKey = `${site.siteId}:${year}:${make}`;
    const cached = catalogCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.options, { headers: { "Cache-Control": "private, max-age=300" } });
    }
    const options = make
      ? await getVehicleModels(year, make, settings)
      : await getVehicleMakes(year, settings);
    catalogCache.set(cacheKey, { options, expiresAt: Date.now() + 60 * 60 * 1000 });
    return NextResponse.json(options, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    const status = error instanceof VehicleApiError && error.code === "not_configured" ? 503 : 502;
    return NextResponse.json({ error: "Vehicle options are temporarily unavailable." }, { status });
  }
}
