import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { getDb, media } from "@platform/db";

const MAX_UPLOAD = 12 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/gif", "image/tiff", "image/x-tiff", "image/webp", "image/avif", "image/svg+xml"];
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".tif", ".tiff", ".webp", ".avif", ".svg"];

export async function storeMediaFile({ siteId, file, alt, maxWidth }: { siteId: string; file: File; alt?: string; maxWidth?: number }) {
  if (process.env.VERCEL) throw new Error("Local media uploads are disabled on Vercel. Configure persistent S3/R2 media storage for production.");
  if (!/^[a-f0-9-]{36}$/i.test(siteId)) throw new Error("Invalid site");
  if (file.size === 0 || file.size > MAX_UPLOAD) throw new Error("Choose an image up to 12 MB");
  const extension = extname(file.name).toLowerCase();
  if (!TYPES.includes(file.type.toLowerCase()) && !EXTENSIONS.includes(extension)) {
    throw new Error("Upload JPG, PNG, GIF, WebP, AVIF, SVG, TIF, or TIFF");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const original = await sharp(bytes, { failOn: "error", limitInputPixels: 40_000_000 }).metadata();
  if (!original.width || !original.height) throw new Error("Invalid image");
  const width = Number.isFinite(maxWidth) ? Math.min(3000, Math.max(100, Math.round(maxWidth!))) : 1600;
  let best: Buffer | null = null;
  for (const quality of [84, 76, 66, 56, 48]) {
    const output = await sharp(bytes, { failOn: "error" }).rotate().resize({ width, withoutEnlargement: true, fit: "inside" }).webp({ quality }).toBuffer();
    best = output;
    if (output.length <= 100 * 1024) break;
  }
  if (!best) throw new Error("Image processing failed");
  const result = await sharp(best).metadata();
  const key = crypto.randomUUID();
  const outDir = resolve(process.cwd(), "../sites/public/images_nextjs", siteId);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, `${key}.webp`), best, { flag: "wx" });
  const url = `/images_nextjs/${siteId}/${key}.webp`;
  const id = crypto.randomUUID();
  const row = { id, siteId, url, alt: alt?.trim().slice(0, 255) || null, width: result.width ?? null, height: result.height ?? null, size: best.length, folder: "uploads" };
  await getDb().insert(media).values(row);
  return row;
}


/**
 * Preserve quote artwork as a real SVG rather than converting it to WebP.
 * Static SVG only: deny scripts, CSS, external references and active SVG elements.
 * Use an actual XML/SVG sanitizer if support for complex SVG exports is required.
 */
export async function storeStaticSvgFile({ siteId, file, alt }: { siteId: string; file: File; alt?: string }) {
  if (process.env.VERCEL) throw new Error("Local media uploads are disabled on Vercel. Configure persistent S3/R2 storage.");
  if (!/^[a-f0-9-]{36}$/i.test(siteId)) throw new Error("Invalid site");
  if (!/\.svg$/i.test(file.name) || (file.type && file.type !== "image/svg+xml")) throw new Error("Upload an SVG file");
  if (file.size === 0 || file.size > 512 * 1024) throw new Error("SVG must be smaller than 512 KB");

  let source = Buffer.from(await file.arrayBuffer()).toString("utf8").replace(/^\uFEFF/, "").trim();
  // Allow a normal XML declaration and comments, but no DOCTYPE, entities or processing instructions.
  source = source.replace(/^<\?xml\s[^?]*\?>\s*/i, "").replace(/<!--[\s\S]*?-->/g, "").trim();
  if (!/^<svg\s|^<svg>/i.test(source) || !/<\/svg>\s*$/i.test(source)) throw new Error("Invalid SVG document");
  if (/<!|<\?|&(?:#|[a-z])/i.test(source)) throw new Error("SVG contains unsupported XML or entities");
  const elements = new Set(["svg", "g", "defs", "path", "rect", "circle", "ellipse", "line", "polygon", "polyline", "lineargradient", "radialgradient", "stop", "clippath", "mask", "text", "tspan", "title", "desc"]);
  const attributes = new Set(["xmlns", "viewbox", "width", "height", "version", "preserveaspectratio", "d", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "fill", "fill-rule", "fill-opacity", "stroke", "stroke-width", "stroke-linejoin", "stroke-linecap", "stroke-miterlimit", "stroke-dasharray", "stroke-dashoffset", "stroke-opacity", "opacity", "transform", "points", "id", "clip-path", "mask", "offset", "gradientunits", "gradienttransform", "spreadmethod", "stop-color", "stop-opacity", "class", "vector-effect", "paint-order", "display"]);
  const tags = source.match(/<[^>]+>/g) ?? [];
  if (!tags.length || tags.length > 10000) throw new Error("SVG is too complex");
  for (const tag of tags) {
    const closing = /^<\/([a-z][\w-]*)\s*>$/i.exec(tag);
    if (closing) {
      if (!elements.has(closing[1].toLowerCase())) throw new Error("Unsupported SVG element");
      continue;
    }
    const match = /^<([a-z][\w-]*)([\s\S]*?)\s*\/?>$/i.exec(tag);
    if (!match || !elements.has(match[1].toLowerCase())) throw new Error("SVG must use static vector elements only");
    const rawAttrs = match[2].replace(/\s*\/$/, "");
    const attrExp = /([a-z_:][\w:.-]*)\s*=\s*(["'])([\s\S]*?)\2/gi;
    let residue = rawAttrs;
    for (const attribute of rawAttrs.matchAll(attrExp)) {
      const name = attribute[1].toLowerCase();
      const value = attribute[3];
      if (!attributes.has(name)) throw new Error(`SVG attribute ${name} is not allowed. Export as Plain SVG.`);
      if (name === "xmlns" && value !== "http://www.w3.org/2000/svg") throw new Error("Invalid SVG namespace");
      if (name !== "xmlns" && (/[<>&]/.test(value) || /(?:javascript:|data:|https?:|@import|expression\s*\()/i.test(value) || (/url\s*\(/i.test(value) && !/^url\(#[a-zA-Z0-9_-]+\)$/.test(value)))) {
        throw new Error("SVG has an unsafe reference");
      }
      residue = residue.replace(attribute[0], "");
    }
    if (residue.trim()) throw new Error("SVG contains unsupported attributes");
  }
  // Sharp decodes SVG and validates dimensions without emitting or rasterizing it.
  let meta;
  try { meta = await sharp(Buffer.from(source), { failOn: "error", limitInputPixels: 40_000_000 }).metadata(); }
  catch { throw new Error("Could not read SVG. Export it as Plain SVG and try again."); }
  if (!meta.width || !meta.height || meta.width > 10000 || meta.height > 10000) throw new Error("Invalid SVG dimensions");
  const id = crypto.randomUUID();
  const outDir = resolve(process.cwd(), "../sites/public/images_nextjs", siteId);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, `${id}.svg`), source, { encoding: "utf8", flag: "wx" });
  const url = `/images_nextjs/${siteId}/${id}.svg`;
  const row = { id, siteId, url, alt: alt?.trim().slice(0, 255) || "SVG artwork", width: meta.width, height: meta.height, size: Buffer.byteLength(source), folder: "svg" };
  await getDb().insert(media).values(row);
  return row;
}

export const storeQuoteSvgFile = storeStaticSvgFile;
