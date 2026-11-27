export const widgetButtonIdBases = ["open-GUSAI-Widget", "open-GUS-TIRE-Widget"] as const;
export type WidgetButtonIdBase = (typeof widgetButtonIdBases)[number];

export const widgetButtonHrefPrefix = "#widget-button=";

export function isWidgetButtonIdBase(value: unknown): value is WidgetButtonIdBase {
  return typeof value === "string" && (widgetButtonIdBases as readonly string[]).includes(value);
}

export function widgetButtonHref(base: WidgetButtonIdBase) {
  return `${widgetButtonHrefPrefix}${base}`;
}

export function widgetButtonBaseFromHref(href?: string | null): WidgetButtonIdBase | undefined {
  const value = href?.startsWith(widgetButtonHrefPrefix) ? href.slice(widgetButtonHrefPrefix.length) : undefined;
  return isWidgetButtonIdBase(value) ? value : undefined;
}
