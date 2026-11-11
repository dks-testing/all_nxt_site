import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

/** Called by the admin app after publish/edits: expires every cached page + query of one site. */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { siteId } = (await req.json().catch(() => ({}))) as { siteId?: string };
  if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });
  revalidateTag(`site:${siteId}`, { expire: 0 });
  return NextResponse.json({ ok: true, revalidated: `site:${siteId}`, at: new Date().toISOString() });
}
