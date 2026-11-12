import type { DesignOptions, SiteBundle } from "@platform/db";

// Name substitutions belong to visible copy only. Rewriting URLs or layout keys such
// as "micks-home" breaks images and can hide entire sections during Zod parsing.
const GLOBAL_NAME_PATTERN = /\{\{\s*(?:businessName|shopName|ownerName)\s*\}\}|Mick(?:'|’)?s Repair\b|\bMick(?:'|’)?s\b/gi;

/** Never default a cloned website's short name to the original tenant's name. */
export function getOwnerName(bundle: SiteBundle): string {
  const explicit = bundle.settings?.ownerName?.trim();
  if (explicit) return explicit;
  const businessName = bundle.settings?.businessName?.trim() || bundle.site.name;
  return /^Mick(?:'|’)?s Repair$/i.test(businessName) ? "Mick’s" : businessName;
}

/** Replaces tokens and legacy shop references in *displayed text*. */
export function globalText(value: string | null | undefined, bundle: SiteBundle): string {
  if (!value) return value ?? "";
  const businessName = bundle.settings?.businessName?.trim() || bundle.site.name;
  const ownerName = getOwnerName(bundle);
  return value.replace(GLOBAL_NAME_PATTERN, (match) => (
    /ownerName/i.test(match) || (!/businessName|shopName|repair/i.test(match) && /^mick/i.test(match))
      ? ownerName
      : businessName
  ));
}

// CMS keys which contain text shown to visitors. URLs, image paths, class names,
// section variants, integration keys and machine-readable identifiers are excluded.
const TEXT_FIELDS = new Set([
  "heading", "subheading", "eyebrow", "title", "subtitle", "body", "description",
  "summary", "text", "label", "caption", "placeholder", "question", "answer",
  "offerHeading", "offerBody", "calloutHeading", "calloutBody", "supportText",
  "closingText", "footerNote", "intro", "problem", "diagnosis", "fix", "discount",
  "shortDescription", "testimonial", "quote", "note", "buttonLabel", "ctaLabel",
]);
const TEXT_LIST_FIELDS = new Set(["highlights", "bullets", "labels", "benefits", "paragraphs", "badges", "features"]);

function isDisplayText(value: string): boolean {
  const trimmed = value.trim();
  // Even inside a nominally textual field, preserve links and asset references.
  if (/^(?:[a-z][a-z0-9+.-]*:|\/|#|\\)/i.test(trimmed)) return false;
  if (/\.(?:svg|png|jpe?g|webp|gif|avif|ico|pdf)(?:[?#]|$)/i.test(trimmed)) return false;
  return true;
}

function applyToDisplayFields(value: unknown, bundle: SiteBundle, field?: string): unknown {
  if (typeof value === "string") {
    if (field && (TEXT_FIELDS.has(field) || TEXT_LIST_FIELDS.has(field)) && isDisplayText(value)) {
      return globalText(value, bundle);
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => typeof item === "string"
      ? (field && TEXT_LIST_FIELDS.has(field) && isDisplayText(item) ? globalText(item, bundle) : item)
      : applyToDisplayFields(item, bundle));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, applyToDisplayFields(item, bundle, key)]),
    );
  }
  return value;
}

/** Safe, nonmutating CMS text replacement. Keeps variants, media and links intact. */
export function globalizeContent<T>(value: T, bundle: SiteBundle): T {
  return applyToDisplayFields(value, bundle) as T;
}

function includesAny(value: string, terms: string[]) {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

/** Maps any repeated CTA to its one site-wide destination. */
export function globalCtaHref(design: DesignOptions, href?: string | null, label?: string | null) {
  const signal = `${href ?? ""} ${label ?? ""}`;
  if (includesAny(signal, ["make-an-appointment", "schedule service", "book appointment", "book service"])) {
    return design.scheduleCtaHref || "/make-an-appointment/";
  }
  if (includesAny(signal, ["diagnostic", "start diagnosis", "pre-diagnosis"])) {
    return design.diagnosticsCtaHref || "/diagnostics/";
  }
  if (includesAny(signal, ["/tires", "find my tires", "find the right tires", "tire finder"])) {
    return design.tiresCtaHref || "/tires/";
  }
  return href || "#";
}

/** Diagnostics and tire finder intentionally share one embed configuration. */
export function sharedToolConfig(bundle: SiteBundle) {
  return bundle.integrations.tire_finder || bundle.integrations.ai_diagnostic;
}
