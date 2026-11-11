import { NextResponse } from "next/server";
import { getUser, siteRole } from "@/lib/auth";
import { storeMediaFile, storeStaticSvgFile } from "@/lib/media";
import { afterChange } from "@/lib/mutate";

const rank = { VIEWER: 1, EDITOR: 2, OWNER: 3 } as const;

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const role = await siteRole(user, siteId);
  if (!role || rank[role] < rank.EDITOR) return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  try {
    const fd = await request.formData();
    const file = fd.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image" }, { status: 400 });
    const row = fd.get("preserveSvg") === "static"
      ? await storeStaticSvgFile({ siteId, file, alt: String(fd.get("alt") ?? "SVG artwork") })
      : await storeMediaFile({ siteId, file, alt: String(fd.get("alt") ?? ""), maxWidth: Number(fd.get("maxWidth") ?? 1600) });
    await afterChange(siteId, user.id, "media.upload", { url: row.url, width: row.width ?? undefined, height: row.height ?? undefined, bytes: row.size });
    return NextResponse.json({ asset: row });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
