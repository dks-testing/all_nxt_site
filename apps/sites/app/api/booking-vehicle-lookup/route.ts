import { NextResponse } from "next/server";
import { z } from "zod";
import { bookingSettings, eq, getDb, resolveHost, resolveSiteSlug } from "@platform/db";
import { lookupLicensePlate, VehicleApiError } from "@/lib/vehicle-api";

export const dynamic = "force-dynamic";

const inputSchema = z.object({
  siteSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  plate: z.string().trim().min(2).max(16).regex(/^[A-Za-z0-9 -]+$/),
  state: z.string().trim().length(2).regex(/^[A-Za-z]{2}$/),
});

const hits = new Map<string, number[]>();
function limited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < 10 * 60_000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > 20;
}

async function requestSite(request: Request, requestedSlug?: string) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const isLocal = process.env.NODE_ENV === "development" && /^(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(host);
  return isLocal && requestedSlug ? resolveSiteSlug(requestedSlug) : resolveHost(host);
}

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 2_000) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid license plate and state." }, { status: 400 });

  const site = await requestSite(request, parsed.data.siteSlug);
  if (!site || site.status !== "PUBLISHED") return NextResponse.json({ error: "Site not found." }, { status: 404 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(`${site.siteId}:${ip}`)) return NextResponse.json({ error: "Too many vehicle lookups. Please try again shortly." }, { status: 429 });

  const [booking] = await getDb()
    .select({ vehicleApi: bookingSettings.vehicleApi })
    .from(bookingSettings)
    .where(eq(bookingSettings.siteId, site.siteId))
    .limit(1);

  try {
    const vehicle = await lookupLicensePlate(parsed.data.plate, parsed.data.state, booking?.vehicleApi ?? {});
    return NextResponse.json({ vehicle }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof VehicleApiError && error.code === "not_found") {
      return NextResponse.json({ error: "Vehicle not found. Check the license plate and state." }, { status: 404 });
    }
    if (error instanceof VehicleApiError && error.code === "not_configured") {
      return NextResponse.json({ error: "Vehicle lookup is not configured for this website." }, { status: 503 });
    }
    return NextResponse.json({ error: "Vehicle lookup is temporarily unavailable." }, { status: 502 });
  }
}
