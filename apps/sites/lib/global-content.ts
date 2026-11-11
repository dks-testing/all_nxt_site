import type { DesignOptions, SiteBundle } from "@platform/db";

const SHOP_NAME_PATTERN = /\{\{\s*(?:businessName|shopName)\s*\}\}|Mick(?:'|’)?s Repair/gi;

/** Replaces both the supported placeholder and legacy template name. */
export function globalText(value: string | null | undefined, bundle: SiteBundle) {
  if (!value) return value ?? "";
  const name = bundle.settings?.businessName || bundle.site.name;
  return value.replace(SHOP_NAME_PATTERN, name);
}

/** Applies global text tokens to nested CMS block data without mutating it. */
export function globalizeContent<T>(value: T, bundle: SiteBundle): T {
  if (typeof value === "string") return globalText(value, bundle) as T;
  if (Array.isArray(value)) return value.map((item) => globalizeContent(item, bundle)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, globalizeContent(item, bundle)])) as T;
  }
  return value;
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
