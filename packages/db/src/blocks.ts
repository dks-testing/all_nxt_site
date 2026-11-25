import { z } from "zod";

/**
 * Section blocks: each block type has a Zod schema for its props.
 * The sites app renders them; the admin app builds its editor forms from `blockFields`.
 * Adding a block = add a schema + fields here, and a component in apps/sites/components/blocks.
 */

const link = z.object({ label: z.string().min(1), href: z.string().min(1) });
const richTextHeadingTags = ["h1", "h2", "h3", "h4", "h5", "h6", "strong", "b"] as const;

export function splitLegacyOffer(props: unknown): unknown {
  if (!props || typeof props !== "object" || Array.isArray(props)) return props;
  const values = props as Record<string, unknown>;
  const heading = values.offerHeading;
  if (typeof values.offerAmount === "string" && values.offerAmount.trim()) return props;
  if (typeof heading !== "string") return props;
  const [amount, ...headingLines] = heading.split(/\r?\n/);
  if (!headingLines.length) return props;
  return {
    ...values,
    offerAmount: amount.trim(),
    offerHeading: headingLines.join("\n").trim(),
  };
}

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
    missionHeading: z.string().optional(),
    missionBody: z.string().optional(),
    locationLabel: z.string().optional(),
    phoneLabel: z.string().optional(),
    hoursLabel: z.string().optional(),
    callCtaLabel: z.string().optional(),
    teamImageUrl: z.string().optional(),
    vehicleImageUrl: z.string().optional(),
    animateVehicleImage: z.boolean().default(true),
    workHeading: z.string().optional(),
    workItems: z.array(z.object({ title: z.string(), body: z.string() })).optional(),
    ownerHeading: z.string().optional(),
    ownerBody: z.string().optional(),
    teamMemberIds: z.array(z.string()).default([]),
    /** Legacy embedded crew data remains readable while sites migrate to team profiles. */
    crew: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
    crewImageUrls: z.array(z.string()).optional(),
    finalHeading: z.string().optional(),
    finalBody: z.string().optional(),
    finalCta: link.optional(),
  }),
  about_intro: z.object({
    eyebrow: z.string().optional(),
    heading: z.string().min(1),
    body: z.string().default(""),
    imageUrl: z.string().optional(),
  }),
  about_mission: z.object({
    heading: z.string().min(1),
    body: z.string().default(""),
    imageUrl: z.string().optional(),
    animateVehicleImage: z.boolean().default(true),
    locationLabel: z.string().optional(),
    phoneLabel: z.string().optional(),
    hoursLabel: z.string().optional(),
  }),
  about_work: z.object({
    heading: z.string().min(1),
    imageUrl: z.string().optional(),
    items: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
  }),
  about_owner: z.object({
    heading: z.string().min(1),
    ownerName: z.string().optional(),
    body: z.string().default(""),
    imageUrl: z.string().optional(),
  }),
  team_gallery: z.object({
    heading: z.string().optional(),
    teamMemberIds: z.array(z.string()).default([]),
  }),
  about_cta: z.object({
    heading: z.string().min(1),
    body: z.string().optional(),
    cta: link,
  }),
  services_grid: z.object({
    heading: z.string().default("Our services"),
    subheading: z.string().optional(),
    limit: z.number().int().min(1).max(50).optional(),
    ctaLabel: z.string().optional(),
  }),
  specials: z.object({ heading: z.string().default("Featured Offers & Specials"), subheading: z.string().optional() }),
  reviews: z.object({
    heading: z.string().default("What our customers say"),
    limit: z.number().int().min(1).max(30).default(6),
    facebookReviewUrl: z.string().trim().refine((value) => !value || /^https?:\/\//i.test(value), "Enter a full http:// or https:// URL").optional(),
    googleReviewUrl: z.string().trim().refine((value) => !value || /^https?:\/\//i.test(value), "Enter a full http:// or https:// URL").optional(),
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
    imageUrl: z.string().optional(),
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
  rich_text: z.object({
    heading: z.string().optional(),
    headingTag: z.enum(richTextHeadingTags).default("h1"),
    body: z.string().default(""),
    items: z.array(z.object({
      heading: z.string().default(""),
      headingTag: z.enum(richTextHeadingTags).default("h2"),
      body: z.string().default(""),
    })).optional(),
  }),
  embed: z.preprocess(splitLegacyOffer, z.object({
    heading: z.string().optional(),
    body: z.string().optional(),
    integration: z.enum(["tire_finder", "ai_diagnostic", "custom"]).default("custom"),
    url: z.string().optional(),
    height: z.number().int().min(100).max(3000).default(700),
    variant: z.enum(["default", "micks-ai", "micks-tires"]).default("default"),
    toolDescription: z.string().optional(),
    imageUrl: z.string().optional(),
    cta: link.optional(),
    offerAmount: z.string().optional(),
    offerHeading: z.string().optional(),
    offerBody: z.string().optional(),
  })),
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
  about_intro: "About · Introduction",
  about_mission: "About · Mission & contact",
  about_work: "About · How we work",
  about_owner: "About · Meet the owner",
  team_gallery: "About · Team gallery",
  about_cta: "About · Final call to action",
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
  | { path: string; label: string; kind: "text" | "textarea" | "url" | "image" | "number"; help?: string }
  | { path: string; label: string; kind: "boolean"; defaultChecked?: boolean; help?: string }
  | { path: string; label: string; kind: "image-list"; help?: string }
  | { path: string; label: string; kind: "team"; help?: string }
  | { path: string; label: string; kind: "select"; options: string[] }
  | { path: string; label: string; kind: "list"; help?: string } // string[] one per line
  | { path: string; label: string; kind: "pairs"; keys: [string, string]; help?: string } // [{a,b}] "a | b" per line
  | { path: string; label: string; kind: "rich-text" }
  | { path: string; label: string; kind: "rich-text-items"; help?: string };

export const blockFields: Record<BlockType, Field[]> = {
  hero: [
    { path: "eyebrow", label: "Eyebrow (small text above heading)", kind: "text" },
    { path: "heading", label: "Heading", kind: "text", help: "Use <br> to start a new line." },
    { path: "subheading", label: "Subheading", kind: "rich-text" },
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
    { path: "closingText", label: "Closing statement below cards", kind: "rich-text" },
  ],
  about: [
    { path: "eyebrow", label: "Eyebrow", kind: "text" },
    { path: "heading", label: "Heading", kind: "text" },
    { path: "body", label: "Body", kind: "rich-text" },
    { path: "imageUrl", label: "Image", kind: "image" },
    { path: "highlights", label: "Highlights", kind: "list", help: "One per line" },
    { path: "cta.label", label: "Button label", kind: "text" },
    { path: "cta.href", label: "Button link", kind: "text" },
    { path: "certificationLogoUrl", label: "Certification logo", kind: "image" },
    { path: "variant", label: "Layout", kind: "select", options: ["default", "micks-home"] },
    { path: "missionHeading", label: "Mission heading", kind: "text" },
    { path: "animateVehicleImage", label: "Animate vehicle image on scroll", kind: "boolean", defaultChecked: true },
    { path: "missionBody", label: "Mission text", kind: "rich-text" },
    { path: "locationLabel", label: "Location column label", kind: "text" },
    { path: "phoneLabel", label: "Phone column label", kind: "text" },
    { path: "hoursLabel", label: "Hours column label", kind: "text" },
    { path: "teamImageUrl", label: "How we work team image", kind: "image" },
    { path: "vehicleImageUrl", label: "Mission vehicle image", kind: "image" },
    { path: "workHeading", label: "How we work heading", kind: "text" },
    { path: "workItems", label: "How we work items", kind: "pairs", keys: ["title", "body"], help: "One per line: Heading | Description" },
    { path: "ownerHeading", label: "Owner / crew heading", kind: "text" },
    { path: "ownerBody", label: "Owner biography", kind: "rich-text" },
    { path: "teamMemberIds", label: "Team members shown on this page", kind: "team", help: "Select profiles and use the arrows to set their display order." },
    { path: "finalHeading", label: "Final call-to-action heading", kind: "text" },
    { path: "finalBody", label: "Final call-to-action text", kind: "rich-text" },
    { path: "finalCta.label", label: "Final button label", kind: "text" },
    { path: "finalCta.href", label: "Final button link", kind: "text" },
  ],
  about_intro: [
    { path: "eyebrow", label: "Eyebrow", kind: "text" },
    { path: "heading", label: "Heading", kind: "text" },
    { path: "body", label: "Body", kind: "rich-text" },
    { path: "imageUrl", label: "Introduction image", kind: "image" },
  ],
  about_mission: [
    { path: "heading", label: "Mission heading", kind: "text" },
    { path: "animateVehicleImage", label: "Animate vehicle image on scroll", kind: "boolean", defaultChecked: true },
    { path: "body", label: "Mission text", kind: "rich-text" },
    { path: "imageUrl", label: "Vehicle image", kind: "image" },
    { path: "locationLabel", label: "Location column label", kind: "text" },
    { path: "phoneLabel", label: "Phone column label", kind: "text" },
    { path: "hoursLabel", label: "Hours column label", kind: "text" },
  ],
  about_work: [
    { path: "heading", label: "Section heading", kind: "text" },
    { path: "items", label: "How we work points", kind: "pairs", keys: ["title", "body"], help: "Add each point separately and reorder it with the arrow buttons." },
    { path: "imageUrl", label: "Team image", kind: "image" },
  ],
  about_owner: [
    { path: "heading", label: "Section heading", kind: "text" },
    { path: "ownerName", label: "Owner name", kind: "text" },
    { path: "body", label: "Owner biography", kind: "rich-text" },
    { path: "imageUrl", label: "Owner image", kind: "image" },
  ],
  team_gallery: [
    { path: "heading", label: "Optional gallery heading", kind: "text" },
    { path: "teamMemberIds", label: "Team members shown on this page", kind: "team", help: "Select profiles and use the arrows to set their display order." },
  ],
  about_cta: [
    { path: "heading", label: "Heading", kind: "text" },
    { path: "body", label: "Text", kind: "rich-text" },
    { path: "cta.label", label: "Button label", kind: "text" },
    { path: "cta.href", label: "Button link", kind: "text" },
  ],
  services_grid: [
    { path: "heading", label: "Heading", kind: "text" },
    { path: "subheading", label: "Subheading", kind: "rich-text" },
    { path: "limit", label: "Max services shown (empty = all)", kind: "number" },
  ],
  specials: [
    { path: "heading", label: "Heading", kind: "text" },
    { path: "subheading", label: "Subheading", kind: "rich-text" },
  ],
  reviews: [
    { path: "heading", label: "Heading", kind: "text" },
    { path: "limit", label: "Number of reviews", kind: "number" },
    { path: "facebookReviewUrl", label: "Facebook review button URL", kind: "text" },
    { path: "googleReviewUrl", label: "Google review button URL", kind: "text" },
    { path: "variant", label: "Layout", kind: "select", options: ["default", "micks-home"] },
  ],
  case_studies: [
    { path: "heading", label: "Heading", kind: "text" },
    { path: "subheading", label: "Intro text", kind: "rich-text" },
    { path: "closingText", label: "Closing text", kind: "rich-text" },
    { path: "labels", label: "Card category labels", kind: "list", help: "One label per card, in case-study order" },
    { path: "variant", label: "Layout", kind: "select", options: ["default", "micks-home"] },
  ],
  faq: [{ path: "heading", label: "Heading", kind: "text" }],
  contact_map: [
    { path: "imageUrl", label: "Contact page photo", kind: "image" },
    { path: "heading", label: "Heading", kind: "text" },
    { path: "variant", label: "Layout", kind: "select", options: ["default", "micks-home"] },
  ],
  booking_form: [
    { path: "heading", label: "Heading", kind: "text" },
    { path: "subheading", label: "Subheading", kind: "textarea" },
  ],
  cta: [
    { path: "heading", label: "Heading", kind: "text" },
    { path: "body", label: "Body", kind: "rich-text" },
    { path: "cta.label", label: "Button label", kind: "text" },
    { path: "cta.href", label: "Button link", kind: "text" },
    { path: "variant", label: "Style", kind: "select", options: ["primary", "dark", "light"] },
  ],
  rich_text: [
    { path: "items", label: "Content sections", kind: "rich-text-items", help: "Use the Body toolbar to format text and insert images." },
  ],
  embed: [
    { path: "heading", label: "Heading", kind: "text", help: "Use <br> or press Enter to start a new line." },
    { path: "body", label: "Intro text", kind: "rich-text" },
    { path: "integration", label: "Source", kind: "select", options: ["tire_finder", "ai_diagnostic", "custom"] },
    { path: "url", label: "Iframe URL (custom, or overrides integration)", kind: "url" },
    { path: "height", label: "Height (px)", kind: "number" },
    { path: "variant", label: "Layout", kind: "select", options: ["default", "micks-ai", "micks-tires"] },
    { path: "imageUrl", label: "Feature image", kind: "image" },
    { path: "cta.label", label: "Button label", kind: "text" },
    { path: "cta.href", label: "Button link", kind: "text" },
    { path: "toolDescription", label: "Tool description", kind: "rich-text" },
    { path: "offerAmount", label: "Offer Amount", kind: "text" },
    { path: "offerHeading", label: "Offer heading", kind: "text" },
    { path: "offerBody", label: "Offer text", kind: "rich-text" },
  ],
  smart_feature: [
    { path: "eyebrow", label: "Eyebrow", kind: "text" },
    { path: "heading", label: "Heading", kind: "text" },
    { path: "body", label: "Body", kind: "rich-text" },
    { path: "calloutHeading", label: "Callout heading", kind: "text" },
    { path: "calloutBody", label: "Callout text", kind: "rich-text" },
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
    about_intro: { eyebrow: "About Us", heading: "About us", body: "" },
    about_mission: { heading: "Our mission", body: "" },
    about_work: { heading: "How we work", items: [] },
    about_owner: { heading: "Meet the owner", body: "" },
    team_gallery: { teamMemberIds: [] },
    about_cta: { heading: "Ready to get started?", cta: { label: "Start Diagnostics", href: "/diagnostics/" } },
    cta: { heading: "Ready to get started?", cta: { label: "Contact us", href: "/contact" }, variant: "primary" },
    smart_feature: { heading: "Smart tools", body: "", variant: "intro", integration: "ai_diagnostic", showCertifications: false },
  };
  return blockSchemas[type].parse(defaults[type] ?? {}) as Record<string, unknown>;
}
