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
  "offerAmount", "offerHeading", "offerBody", "calloutHeading", "calloutBody", "supportText",
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

/** Resolves a repeated action to its one site-wide label and destination. */
export function globalCta(design: DesignOptions, href?: string | null, label?: string | null) {
  const signal = `${href ?? ""} ${label ?? ""}`;
  if (includesAny(signal, ["tel:", "call now", "call us", "make a call"])) {
    return { href: design.callCtaHref || href || "#", label: design.callCtaLabel || "Call Now" };
  }
  if (includesAny(signal, ["make-an-appointment", "schedule service", "book appointment", "book service"])) {
    return { href: design.scheduleCtaHref || "/make-an-appointment/", label: design.scheduleCtaLabel || "Schedule Service" };
  }
  if (includesAny(signal, ["diagnostic", "start diagnosis", "pre-diagnosis"])) {
    return { href: design.diagnosticsCtaHref || "/diagnostics/", label: design.diagnosticsCtaLabel || "Start Diagnostics" };
  }
  if (includesAny(signal, ["/tires", "find my tires", "find the right tires", "tire finder"])) {
    return { href: design.tiresCtaHref || "/tires/", label: design.tiresCtaLabel || "Find the Right Tires" };
  }
  if (/\/about-us\/?(?:[#?].*)?$/i.test(href || "") || includesAny(label || "", ["about us", "our story"])) {
    return { href: design.aboutCtaHref || "/about-us/", label: design.aboutCtaLabel || "About Us" };
  }
  if (/\/services\/?(?:[#?].*)?$/i.test(href || "") || includesAny(label || "", ["view services", "our services"])) {
    return { href: design.servicesCtaHref || "/services/", label: design.servicesCtaLabel || "View Services" };
  }
  return { href: href || "#", label: label || "Learn More" };
}

export function globalCtaHref(design: DesignOptions, href?: string | null, label?: string | null) {
  return globalCta(design, href, label).href;
}

export function globalCtaLabel(design: DesignOptions, href?: string | null, label?: string | null) {
  return globalCta(design, href, label).label;
}

export function serviceCardLabel(design: DesignOptions): string {
  const label = design.serviceCardCtaLabel?.trim();
  return !label || /^learn more$/i.test(label) ? "Read More" : label;
}

export type SmartToolKind = "diagnostics" | "tires";

export function smartToolKind(href?: string | null, label?: string | null): SmartToolKind | undefined {
  const signal = `${href ?? ""} ${label ?? ""}`;
  if (includesAny(signal, ["diagnostic", "start diagnosis", "pre-diagnosis"])) return "diagnostics";
  if (includesAny(signal, ["/tires", "find my tires", "find the right tires", "tire finder"])) return "tires";
  return undefined;
}

/** Diagnostics and tire finder intentionally share one embed configuration. */
export function sharedToolConfig(bundle: SiteBundle) {
  return bundle.integrations.tire_finder || bundle.integrations.ai_diagnostic;
}

export function smartToolUrl(bundle: SiteBundle, kind: SmartToolKind): string | undefined {
  const integration = kind === "diagnostics" ? "ai_diagnostic" : "tire_finder";
  const url = bundle.integrations[integration]?.url || sharedToolConfig(bundle)?.url;
  if (!url) return undefined;

  if (/^https?:\/\/embed\.raiseahood\.com\/api\/gus-page(?:\?|$)/i.test(url)) {
    const [path, query = ""] = url.split("?", 2);
    const params = new URLSearchParams(query);
    params.set("type", kind === "diagnostics" ? "gus" : "gus-tire-widget");
    return `${path}?${params.toString()}`;
  }
  return url;
}
