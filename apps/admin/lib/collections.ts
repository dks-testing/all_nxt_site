import { services, specials, faqs, testimonials, caseStudies, banners, redirects } from "@platform/db";

export type CField = {
  name: string;
  label: string;
  kind: "text" | "textarea" | "url" | "image" | "number" | "boolean" | "date" | "datetime" | "select" | "list";
  options?: string[];
  required?: boolean;
  help?: string;
  wide?: boolean;
};

export type CollectionDef = {
  label: string;
  singular: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any;
  title: string; // field shown in list
  subtitle?: string;
  sortable: boolean;
  fields: CField[];
};

/** One generic editor drives all of these. Only listed fields can ever be written. */
export const collections: Record<string, CollectionDef> = {
  services: {
    label: "Services",
    singular: "service",
    description: "Each service gets its own page at /<slug>/ and appears in service grids.",
    table: services,
    title: "name",
    subtitle: "slug",
    sortable: true,
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "slug", label: "URL slug", kind: "text", required: true, help: "Page lives at /slug/. Keep old WordPress slugs to preserve SEO." },
      { name: "summary", label: "Summary", kind: "textarea", wide: true },
      { name: "body", label: "Page body", kind: "textarea", wide: true, help: "Blank line = new paragraph, '- ' = bullet, **bold**" },
      { name: "bullets", label: "Key points", kind: "list", wide: true, help: "One per line" },
      { name: "imageUrl", label: "Image", kind: "image" },
      { name: "priceFrom", label: "Starting price", kind: "text" },
      { name: "seoTitle", label: "SEO title", kind: "text", wide: true },
      { name: "seoDescription", label: "SEO description", kind: "textarea", wide: true },
      { name: "seoKeywords", label: "SEO keywords", kind: "text", wide: true, help: "Optional comma-separated phrases" },
      { name: "isActive", label: "Visible on site", kind: "boolean" },
    ],
  },
  specials: {
    label: "Specials",
    singular: "special",
    description: "Edit offers used by this website. The first visible offer is the full-width featured card; use ↑/↓ to change its position. New lines in Description become inclusion bullets.",
    table: specials,
    title: "title",
    subtitle: "discount",
    sortable: true,
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "discount", label: "Offer price and savings", kind: "text", help: "For example: $149 (a $350+ value, save 60%). The price headline is generated automatically." },
      { name: "couponCode", label: "Coupon code", kind: "text" },
      { name: "validUntil", label: "Valid until", kind: "date" },
      { name: "description", label: "What is included", kind: "textarea", wide: true, help: "One included service per line. Existing descriptions with commas also work. To add a short intro, enter it as the first paragraph, leave a blank line, then list the included services." },
      { name: "imageUrl", label: "Card background image", kind: "image", help: "A dark overlay keeps text readable; if empty, the website’s inner banner is used." },
      { name: "isActive", label: "Visible on site", kind: "boolean" },
    ],
  },
  faqs: {
    label: "FAQ",
    singular: "question",
    description: "Shown in FAQ sections, with FAQPage schema for Google.",
    table: faqs,
    title: "question",
    sortable: true,
    fields: [
      { name: "question", label: "Question", kind: "text", required: true, wide: true },
      { name: "answer", label: "Answer", kind: "textarea", required: true, wide: true },
    ],
  },
  testimonials: {
    label: "Testimonials",
    singular: "testimonial",
    description: "Customer reviews shown in Reviews sections. Only add real reviews you have permission to show.",
    table: testimonials,
    title: "author",
    subtitle: "source",
    sortable: true,
    fields: [
      { name: "author", label: "Customer name", kind: "text", required: true },
      { name: "rating", label: "Rating (1-5)", kind: "number" },
      { name: "source", label: "Source", kind: "select", options: ["manual", "google"] },
      { name: "reviewDate", label: "Review date", kind: "date" },
      { name: "body", label: "Review", kind: "textarea", required: true, wide: true },
      { name: "isActive", label: "Visible on site", kind: "boolean" },
    ],
  },
  "case-studies": {
    label: "Case studies",
    singular: "case study",
    description: "Problem → diagnosis → fix stories.",
    table: caseStudies,
    title: "title",
    sortable: true,
    fields: [
      { name: "title", label: "Title", kind: "text", required: true, wide: true },
      { name: "problem", label: "Problem", kind: "textarea", required: true, wide: true },
      { name: "diagnosis", label: "Diagnosis", kind: "textarea", wide: true },
      { name: "fix", label: "Fix", kind: "textarea", wide: true },
      { name: "imageUrl", label: "Image", kind: "image" },
    ],
  },
  banners: {
    label: "Banners",
    singular: "banner",
    description: "Hero banners override the home page hero while active; top-bar banners show above the header. Schedule with start/end.",
    table: banners,
    title: "heading",
    subtitle: "placement",
    sortable: true,
    fields: [
      { name: "heading", label: "Heading", kind: "text", required: true, wide: true },
      { name: "subheading", label: "Subheading", kind: "textarea", wide: true },
      { name: "placement", label: "Placement", kind: "select", options: ["hero", "top_bar", "promo"] },
      { name: "imageUrl", label: "Image", kind: "image" },
      { name: "ctaLabel", label: "Button label", kind: "text" },
      { name: "ctaUrl", label: "Button link", kind: "text" },
      { name: "startsAt", label: "Starts", kind: "datetime" },
      { name: "endsAt", label: "Ends", kind: "datetime" },
      { name: "isActive", label: "Active", kind: "boolean" },
    ],
  },
  redirects: {
    label: "Redirects",
    singular: "redirect",
    description: "301 redirects from old URLs (e.g. WordPress /?p=123) to new pages.",
    table: redirects,
    title: "fromPath",
    subtitle: "toPath",
    sortable: false,
    fields: [
      { name: "fromPath", label: "From path", kind: "text", required: true, help: "e.g. /old-page/ or /?p=123" },
      { name: "toPath", label: "To", kind: "text", required: true, help: "Path or full URL" },
      { name: "code", label: "Type", kind: "select", options: ["301", "302"] },
    ],
  },
};

export function parseCollectionForm(def: CollectionDef, fd: FormData) {
  const out: Record<string, unknown> = {};
  for (const f of def.fields) {
    const raw = String(fd.get(f.name) ?? "").trim();
    switch (f.kind) {
      case "boolean":
        out[f.name] = fd.get(f.name) === "on";
        break;
      case "number": {
        const n = parseInt(raw, 10);
        out[f.name] = Number.isFinite(n) ? n : f.name === "rating" ? 5 : null;
        if (f.name === "rating") out[f.name] = Math.min(5, Math.max(1, out[f.name] as number));
        break;
      }
      case "list":
        out[f.name] = raw.split("\n").map((x) => x.trim()).filter(Boolean);
        break;
      case "datetime":
        out[f.name] = raw ? new Date(raw) : null;
        break;
      case "select":
        out[f.name] = f.options?.includes(raw) ? (f.name === "code" ? Number(raw) : raw) : f.options?.[0];
        break;
      default:
        out[f.name] = raw || null;
    }
    if (f.required && (out[f.name] === null || out[f.name] === "")) throw new Error(`${f.label} is required`);
  }
  if ("slug" in out && typeof out.slug === "string") out.slug = out.slug.replace(/^\/+|\/+$/g, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  return out;
}
