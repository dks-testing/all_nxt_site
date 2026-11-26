import { NextResponse } from "next/server";
import { z } from "zod";

const catalogUrl = "https://vpic.nhtsa.dot.gov/api/vehicles";
const results = z.object({ Results: z.array(z.unknown()) });
const makeRow = z.object({ MakeId: z.number().int().positive(), MakeName: z.string().trim().min(1).max(64) });
const modelRow = z.object({ Model_Name: z.string().trim().min(1).max(64) });

async function fetchCatalog(endpoint: string) {
  const response = await fetch(`${catalogUrl}/${endpoint}?format=json`, {
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Vehicle catalog request failed");
  return results.parse(await response.json()).Results;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const year = params.get("year");
  const make = params.get("make");
  const headers = { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" };

  try {
    if (year === null && make === null) {
      const rows = (await Promise.all(["car", "truck", "mpv"].map((type) => fetchCatalog(`GetMakesForVehicleType/${type}`)))).flat();
      const makes = new Map<number, string>();
      for (const row of rows) {
        const parsed = makeRow.safeParse(row);
        if (parsed.success) makes.set(parsed.data.MakeId, parsed.data.MakeName);
      }
      if (!makes.size) throw new Error("Vehicle catalog returned no makes");
      const options = [...makes].map(([id, label]) => ({ value: String(id), label })).sort((a, b) => a.label.localeCompare(b.label));
      return NextResponse.json(options, { headers });
    }

    if (!year || !/^\d{4}$/.test(year) || Number(year) < 1996 || Number(year) > new Date().getUTCFullYear() + 1 || !make || !/^[1-9]\d{0,7}$/.test(make)) {
      return NextResponse.json({ error: "Choose a valid model year and make." }, { status: 400 });
    }

    const rows = await fetchCatalog(`GetModelsForMakeIdYear/makeId/${make}/modelyear/${year}`);
    const models = new Map<string, string>();
    for (const row of rows) {
      const parsed = modelRow.safeParse(row);
      if (parsed.success) models.set(parsed.data.Model_Name.toLowerCase(), parsed.data.Model_Name);
    }
    const options = [...models.values()].sort((a, b) => a.localeCompare(b)).map((label) => ({ value: label, label }));
    return NextResponse.json(options, { headers });
  } catch {
    return NextResponse.json({ error: "The vehicle catalog is unavailable." }, { status: 502 });
  }
}
