import { z } from "zod";

/**
 * Section blocks: each block type has a Zod schema for its props.
 * The sites app renders them; the admin app builds its editor forms from `blockFields`.
 * Adding a block = add a schema + fields here, and a component in apps/sites/components/blocks.
 */

const link = z.object({ label: z.string().min(1), href: z.string().min(1) });

export const blockSchemas = {
  hero: z.object({
    eyebrow: z.string().optional(),
    heading: z.string().min(1),
    subheading: z.string().optional(),
    primaryCta: link.optional(),
    secondaryCta: link.optional(),
    tertiaryCta: link.optional(),
    reviewImageUrl: z.string().optional(),
    certificationLogos: z.array(z.string()).default([]),
    imageUrl: z.string().optional(),
    showRating: z.boolean().default(true),
    badges: z.array(z.string()).default([]),
  }),
  trust_cards: z.object({
    heading: z.string().optional(),
    items: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
    closingText: z.string().optional(),
  }),
  about: z.object({
    heading: z.string().min(1),
    body: z.string().default(""),
    imageUrl: z.string().optional(),
    highlights: z.array(z.string()).default([]),
    eyebrow: z.string().optional(),
    cta: link.optional(),
    certificationLogoUrl: z.string().optional(),
    variant: z.enum(["default", "micks-home"]).default("default"),
  }),
  services_grid: z.object({
    heading: z.string().default("Our services"),
    subheading: z.string().optional(),
    limit: z.number().int().min(1).max(50).optional(),
  }),
  specials: z.object({ heading: z.string().default("Current specials") }),
  reviews: z.object({
    heading: z.string().default("What our customers say"),
    limit: z.number().int().min(1).max(30).default(6),
    variant: z.enum(["default", "micks-home"]).default("default"),
  }),
  case_studies: z.object({
    heading: z.string().default("Recent repairs"),
    subheading: z.string().optional(),
    closingText: z.string().optional(),
    labels: z.array(z.string()).default(["Diagnostic Case", "Customer Concern", "Verified Repair"]),
    variant: z.enum(["default", "micks-home"]).default("default"),
  }),
  faq: z.object({ heading: z.string().default("Frequently asked questions") }),
  contact_map: z.object({
    heading: z.string().default("Visit us"),
    variant: z.enum(["default", "micks-home"]).default("default"),
  }),
  booking_form: z.object({
    heading: z.string().default("Schedule service"),
    subheading: z.string().optional(),
  }),
  cta: z.object({
    heading: z.string().min(1),
    body: z.string().optional(),
    cta: link,
    variant: z.enum(["primary", "dark", "light"]).default("primary"),
  }),
  rich_text: z.object({ heading: z.string().optional(), body: z.string().default("") }),
  embed: z.object({
    heading: z.string().optional(),
    body: z.string().optional(),
    integration: z.enum(["tire_finder", "ai_diagnostic", "custom"]).default("custom"),
    url: z.string().optional(),
    height: z.number().int().min(100).max(3000).default(700),
    variant: z.enum(["default", "micks-ai", "micks-tires"]).default("default"),
    imageUrl: z.string().optional(),
    cta: link.optional(),
    offerHeading: z.string().optional(),
    offerBody: z.string().optional(),
  }),
  smart_feature: z.object({
    eyebrow: z.string().optional(),
    heading: z.string().min(1),
    body: z.string().default(""),
    imageUrl: z.string().optional(),
    secondaryImageUrl: z.string().optional(),
    iconUrl: z.string().optional(),
    cta: link.optional(),
    calloutHeading: z.string().optional(),
    calloutBody: z.string().optional(),
    supportText: z.string().optional(),
    variant: z.enum(["intro", "tool", "experience", "cta", "trust", "testimonial", "final"]).default("intro"),
    integration: z.enum(["tire_finder", "ai_diagnostic", "custom"]).default("ai_diagnostic"),
    showCertifications: z.boolean().default(false),
  }),
} as const;

export type BlockType = keyof typeof blockSchemas;
export type BlockProps<T extends BlockType> = z.infer<(typeof blockSchemas)[T]>;
export const blockTypes = Object.keys(blockSchemas) as BlockType[];

export const blockLabels: Record<BlockType, string> = {
  hero: "Hero banner",
  trust_cards: "Trust / value cards",
  about: "About",
  services_grid: "Services grid",
  specials: "Specials",
  reviews: "Reviews",
  case_studies: "Case studies",
  faq: "FAQ",
  contact_map: "Contact + map + hours",
  booking_form: "Booking form",
  cta: "Call to action",
  rich_text: "Rich text",
  embed: "Embed (tire finder, AI tool, iframe)",
  smart_feature: "Smart tools feature",
};

/** Field descriptors that the admin turns into a form. `path` is dot-notation into props. */
export type Field =
  | { path: string; label: string; kind: "text" | "textarea" | "url" | "image" | "number" | "boolean" }
  | { path: string; label: string; kind: "select"; options: string[] }
  | { path: string; label: string; kind: "list"; help?: string } // string[] one per line
  | { path: string; label: string; kind: "pairs"; keys: [string, string]; help?: string }; // [{a,b}] "a | b" per line

export const blockFields: Record<BlockType, Field[]> = {
  hero: [
    { path: "eyebrow", label: "Eyebrow (small text above heading)", kind: "text" },
    { path: "heading", label: "Heading", kind: "text" },
    { path: "subheading", label: "Subheading", kind: "textarea" },
    { path: "primaryCta.label", label: "Primary button label", kind: "text" },
    { path: "primaryCta.href", label: "Primary button link", kind: "text" },
    { path: "secondaryCta.label", label: "Secondary button label", kind: "text" },
    { path: "secondaryCta.href", label: "Secondary button link", kind: "text" },
    { path: "tertiaryCta.label", label: "Third button label", kind: "text" },
    { path: "tertiaryCta.href", label: "Third button link", kind: "text" },
    { path: "reviewImageUrl", label: "Reviews logo", kind: "image" },
    { path: "imageUrl", label: "Background image", kind: "image" },
    { path: "showRating", label: "Show Google rating", kind: "boolean" },
    { path: "badges", label: "Badges", kind: "list", help: "One per line" },
  ],
  trust_cards: [
    { path: "heading", label: "Heading", kind: "text" },
    { path: "items", label: "Cards", kind: "pairs", keys: ["title", "body"], help: "One per line: Title | Text" },
    { path: "closingText", label: "Closing statement below cards", kind: "textarea" },
  ],
  about: [
    { path: "eyebrow", label: "Eyebrow", kind: "text" },
    { path: "heading", label: "Heading", kind: "text" },
    { path: "body", label: "Body (blank line = new paragraph)", kind: "textarea" },
    { path: "imageUrl", label: "Image", kind: "image" },
    { path: "highlights", label: "Highlights", kind: "list", help: "One per line" },
    { path: "cta.label", label: "Button label", kind: "text" },
    { path: "cta.href", label: "Button link", kind: "text" },
    { path: "certificationLogoUrl", label: "Certification logo", kind: "image" },
    { path: "variant", label: "Layout", kind: "select", options: ["default", "micks-home"] },
  ],
  services_grid: [
    { path: "heading", label: "Heading", kind: "text" },
    { path: "subheading", label: "Subheading", kind: "textarea" },
    { path: "limit", label: "Max services shown (empty = all)", kind: "number" },
  ],
  specials: [{ path: "heading", label: "Heading", kind: "text" }],
  reviews: [
    { path: "heading", label: "Heading", kind: "text" },
    { path: "limit", label: "Number of reviews", kind: "number" },
    { path: "variant", label: "Layout", kind: "select", options: ["default", "micks-home"] },
  ],
  case_studies: [
    { path: "heading", label: "Heading", kind: "text" },
    { path: "subheading", label: "Intro text", kind: "textarea" },
    { path: "closingText", label: "Closing text", kind: "textarea" },
    { path: "labels", label: "Card category labels", kind: "list", help: "One label per card, in case-study order" },
    { path: "variant", label: "Layout", kind: "select", options: ["default", "micks-home"] },
  ],
  faq: [{ path: "heading", label: "Heading", kind: "text" }],
  contact_map: [
    { path: "heading", label: "Heading", kind: "text" },
    { path: "variant", label: "Layout", kind: "select", options: ["default", "micks-home"] },
  ],
  booking_form: [
    { path: "heading", label: "Heading", kind: "text" },
    { path: "subheading", label: "Subheading", kind: "textarea" },
  ],
  cta: [
    { path: "heading", label: "Heading", kind: "text" },
    { path: "body", label: "Body", kind: "textarea" },
    { path: "cta.label", label: "Button label", kind: "text" },
    { path: "cta.href", label: "Button link", kind: "text" },
    { path: "variant", label: "Style", kind: "select", options: ["primary", "dark", "light"] },
  ],
  rich_text: [
    { path: "heading", label: "Heading", kind: "text" },
    { path: "body", label: "Body (blank line = paragraph, '- ' = bullet, **bold**)", kind: "textarea" },
  ],
  embed: [
    { path: "heading", label: "Heading", kind: "text" },
    { path: "body", label: "Intro text", kind: "textarea" },
    { path: "integration", label: "Source", kind: "select", options: ["tire_finder", "ai_diagnostic", "custom"] },
    { path: "url", label: "Iframe URL (custom, or overrides integration)", kind: "url" },
    { path: "height", label: "Height (px)", kind: "number" },
    { path: "variant", label: "Layout", kind: "select", options: ["default", "micks-ai", "micks-tires"] },
    { path: "imageUrl", label: "Feature image", kind: "image" },
    { path: "cta.label", label: "Button label", kind: "text" },
    { path: "cta.href", label: "Button link", kind: "text" },
    { path: "offerHeading", label: "Offer heading", kind: "text" },
    { path: "offerBody", label: "Offer text", kind: "textarea" },
  ],
  smart_feature: [
    { path: "eyebrow", label: "Eyebrow", kind: "text" },
    { path: "heading", label: "Heading", kind: "text" },
    { path: "body", label: "Body (blank line = new paragraph)", kind: "textarea" },
    { path: "calloutHeading", label: "Callout heading", kind: "text" },
    { path: "calloutBody", label: "Callout text", kind: "textarea" },
    { path: "supportText", label: "Supporting text", kind: "text" },
    { path: "imageUrl", label: "Primary image", kind: "image" },
    { path: "secondaryImageUrl", label: "Secondary image", kind: "image" },
    { path: "iconUrl", label: "Tool icon", kind: "image" },
    { path: "cta.label", label: "Button label", kind: "text" },
    { path: "cta.href", label: "Button link", kind: "text" },
    { path: "variant", label: "Layout", kind: "select", options: ["intro", "tool", "experience", "cta", "trust", "testimonial", "final"] },
    { path: "integration", label: "Tool source", kind: "select", options: ["tire_finder", "ai_diagnostic", "custom"] },
    { path: "showCertifications", label: "Show shared certification badges", kind: "boolean" },
  ],
};

export function parseBlock<T extends BlockType>(type: T, props: unknown): BlockProps<T> | null {
  const schema = blockSchemas[type];
  if (!schema) return null;
  const r = schema.safeParse(props ?? {});
  return r.success ? (r.data as BlockProps<T>) : null;
}

export function isBlockType(t: string): t is BlockType {
  return t in blockSchemas;
}

export function defaultBlockProps(type: BlockType): Record<string, unknown> {
  const defaults: Partial<Record<BlockType, Record<string, unknown>>> = {
    hero: { heading: "New hero heading", showRating: true, badges: [] },
    about: { heading: "About us", body: "" },
    cta: { heading: "Ready to get started?", cta: { label: "Contact us", href: "/contact" }, variant: "primary" },
    smart_feature: { heading: "Smart tools", body: "", variant: "intro", integration: "ai_diagnostic", showCertifications: false },
  };
  return blockSchemas[type].parse(defaults[type] ?? {}) as Record<string, unknown>;
}
