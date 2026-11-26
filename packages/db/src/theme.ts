import type { BookingAppearance, ThemeColors, StoredThemeColors, ThemePalette, ThemeFonts, DesignOptions, GlobalButton } from "./schema";

export const fontOptions = ["Inter", "Roboto", "Open Sans", "Montserrat", "Poppins", "Oswald", "Lato", "Barlow", "Source Sans 3", "Merriweather", "Nike Futura ND"] as const;

const customFonts: Partial<Record<(typeof fontOptions)[number], string>> = {
  "Nike Futura ND": "/fonts/nike-futura-nd.woff2",
};

export const defaultColors: ThemeColors = {
  primary: "#1d4ed8",
  primaryForeground: "#ffffff",
  secondary: "#0f172a",
  accent: "#f59e0b",
  background: "#ffffff",
  surface: "#f1f5f9",
  text: "#0f172a",
  muted: "#475569",
  testimonialsBackground: "#6d92b7",
  footerLogoBandBackground: "#f5f5f5",
  featurePanel: "#6a8fb5",
  featureHighlight: "#7198bd",
};

export const defaultFonts: ThemeFonts = { heading: "Montserrat", body: "Inter" };

export const colorPattern = "#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})";
const HEX = new RegExp(`^${colorPattern}$`);

export function normalizeColor(value?: string) {
  if (typeof value !== "string" || !HEX.test(value)) return undefined;
  const hex = value.slice(1).toLowerCase();
  const expanded = hex.length < 6 ? [...hex].map((digit) => digit.repeat(2)).join("") : hex;
  return `#${expanded.length === 8 && expanded.endsWith("ff") ? expanded.slice(0, 6) : expanded}`;
}

const globalColorVariables = {
  primary: "--color-primary",
  secondary: "--color-secondary",
  accent: "--color-accent",
  background: "--color-background",
  surface: "--color-surface",
  testimonialsBackground: "--testimonials-bg",
  footerLogoBandBackground: "--footer-logo-band-bg",
  featurePanel: "--color-feature-panel",
  featureHighlight: "--color-feature-highlight",
  text: "--color-text",
  muted: "--color-muted",
  primaryForeground: "--color-primary-foreground",
} satisfies Record<keyof ThemeColors, string>;

export const componentColors = {
  buttonBackground: { css: "--button-bg", inherits: "primary" },
  buttonText: { css: "--button-text", inherits: "primaryForeground" },
  buttonHoverBackground: { css: "--button-hover-bg", inherits: "primary" },
  buttonHoverText: { css: "--button-hover-text", inherits: "primaryForeground" },
  navButtonBackground: { css: "--nav-button-bg", inherits: "buttonBackground" },
  navButtonText: { css: "--nav-button-text", inherits: "buttonText" },
  navButtonHoverBackground: { css: "--nav-button-hover-bg", inherits: "buttonHoverBackground" },
  navButtonHoverText: { css: "--nav-button-hover-text", inherits: "buttonHoverText" },
  badgeBackground: { css: "--badge-bg", inherits: "accent" },
  badgeText: { css: "--badge-text", inherits: "primaryForeground" },
  trustCardHoverBackground: { css: "--trust-card-hover-bg", inherits: "buttonHoverBackground" },
  trustCardHeadingColor: { css: "--trust-card-heading-color", inherits: "primaryForeground" },
  serviceProcessCardBackground: { css: "--service-process-card-bg", inherits: "buttonHoverBackground" },
  serviceProcessCardHoverBackground: { css: "--service-process-card-hover-bg", inherits: "buttonBackground" },
  serviceProcessCardTextColor: { css: "--service-process-card-text", inherits: null },
  serviceTrustCardBackground: { css: "--service-trust-card-bg", inherits: "buttonHoverBackground" },
  serviceTrustCardHoverBackground: { css: "--service-trust-card-hover-bg", inherits: "buttonBackground" },
  quoteSvgColor: { css: "--color-quote-icon", inherits: null },
  quoteSvgHoverColor: { css: "--color-quote-icon-hover", inherits: "quoteSvgColor" },
  serviceStepIconColor: { css: "--color-step-icon", inherits: null },
  serviceStepIconHoverColor: { css: "--color-step-icon-hover", inherits: "serviceStepIconColor" },
} as const;

export const bookingColors = {
  formBackground: { css: "--color-booking-surface", fallback: "#ffffff" },
  inputBackground: { css: "--color-booking-input-surface", fallback: "#ffffff" },
  formTextColor: { css: "--color-booking-text", fallback: "#111111" },
  inputTextColor: { css: "--color-booking-input-text", fallback: "#111111" },
} as const satisfies Partial<Record<keyof BookingAppearance, { css: string; fallback: string }>>;

export type ComponentColorRole = keyof typeof componentColors;
type BookingColorRole = keyof typeof bookingColors;
export type ColorRole = keyof ThemeColors | ComponentColorRole | BookingColorRole;
const globalRoles = Object.keys(globalColorVariables) as (keyof ThemeColors)[];
export const bookingColorRoles = Object.keys(bookingColors) as BookingColorRole[];
export const componentColorRoles = Object.keys(componentColors) as ComponentColorRole[];
export const colorRoles: ColorRole[] = [...globalRoles, ...bookingColorRoles, ...componentColorRoles];
const colorVariables = {
  ...globalColorVariables,
  ...Object.fromEntries(bookingColorRoles.map((role) => [role, bookingColors[role].css])),
  ...Object.fromEntries(componentColorRoles.map((role) => [role, componentColors[role].css])),
} as Record<ColorRole, string>;

type ColorSource = { colors?: StoredThemeColors | null; design?: DesignOptions | null; bookingAppearance?: BookingAppearance | null };

export function paletteColor(palette: ThemePalette, role: ColorRole) {
  const index = palette.roles[role];
  return index === undefined ? undefined : palette.swatches[index];
}

export function colorIndex(palette: ThemePalette, role: ColorRole): number | undefined {
  const inherits = componentColors[role as ComponentColorRole]?.inherits;
  return palette.roles[role] ?? (inherits ? colorIndex(palette, inherits) : undefined);
}

export function resolveColor(palette: ThemePalette, role: ColorRole): string {
  const index = colorIndex(palette, role);
  return (index === undefined ? undefined : normalizeColor(palette.swatches[index])) ?? "currentColor";
}

/** Store each distinct colour once while retaining explicit and inherited assignments. */
export function buildPalette(values: Partial<Record<ColorRole, string>>): ThemePalette {
  const palette: ThemePalette = { version: 2, swatches: [], roles: {} };
  const indexes = new Map<string, number>();
  const assign = (role: ColorRole, value: string) => {
    let index = indexes.get(value);
    if (index === undefined) {
      index = palette.swatches.length;
      palette.swatches.push(value);
      indexes.set(value, index);
    }
    palette.roles[role] = index;
  };
  for (const role of globalRoles) assign(role, normalizeColor(values[role]) ?? defaultColors[role]);
  for (const role of bookingColorRoles) assign(role, normalizeColor(values[role]) ?? bookingColors[role].fallback);
  for (const role of componentColorRoles) {
    const value = normalizeColor(values[role]);
    if (value) assign(role, value);
  }
  return palette;
}

/** Read both legacy theme rows and the shared palette format. */
export function getThemePalette({ colors, design, bookingAppearance }: ColorSource = {}): ThemePalette {
  const values: Partial<Record<ColorRole, string>> = {};
  if (colors && "swatches" in colors) {
    for (const role of colorRoles) values[role] = paletteColor(colors, role);
    if (colors.version === 2) return buildPalette(values);
  } else {
    for (const role of globalRoles) values[role] = colors?.[role];
    for (const role of componentColorRoles) values[role] = design?.[role];
  }
  for (const role of bookingColorRoles) values[role] = bookingAppearance?.[role];
  const iconHex = /^#[0-9a-f]{6}$/i;
  values.quoteSvgColor = iconHex.test(design?.quoteSvgColor ?? "") ? design?.quoteSvgColor : undefined;
  values.quoteSvgHoverColor = iconHex.test(design?.quoteSvgHoverColor ?? "") ? design?.quoteSvgHoverColor : undefined;
  const stepColor = design?.serviceStepIconColor || design?.serviceTrustIconColor;
  const stepHoverColor = design?.serviceStepIconHoverColor || design?.serviceTrustIconHoverColor;
  values.serviceStepIconColor = iconHex.test(stepColor ?? "") ? stepColor : undefined;
  values.serviceStepIconHoverColor = iconHex.test(stepHoverColor ?? "") ? stepHoverColor : undefined;
  return buildPalette(values);
}

const safeFont = (f: string | undefined, fallback: string) =>
  f && (fontOptions as readonly string[]).includes(f) ? f : fallback;

/** Builds CSS variables from an allowlisted set of design options (never raw input). */
export function getDesign(t?: ColorSource): DesignOptions {
  if (!t?.colors || !("swatches" in t.colors) || t.colors.version !== 2) return t?.design ?? {};
  const { colors, design } = t;
  return {
    ...design,
    quoteSvgColor: paletteColor(colors, "quoteSvgColor"),
    quoteSvgHoverColor: paletteColor(colors, "quoteSvgHoverColor"),
    serviceStepIconColor: paletteColor(colors, "serviceStepIconColor"),
    serviceStepIconHoverColor: paletteColor(colors, "serviceStepIconHoverColor"),
    serviceTrustIconColor: undefined,
    serviceTrustIconHoverColor: undefined,
  };
}

export function isGlobalButtonEnabled(design: DesignOptions, button: GlobalButton) {
  return !design.disabledGlobalButtons?.includes(button);
}

export function getButtonHoverBackground(theme: ColorSource = {}) {
  return resolveColor(getThemePalette(theme), "buttonHoverBackground");
}
const numberRange = (n: number | undefined, min: number, max: number, defaultValue = 0) =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, n!)) : defaultValue;

/** Builds the :root CSS variable block injected into every page of a site. */
export function themeToCss(t: ColorSource & { fonts?: Partial<ThemeFonts> | null; radius?: string | null; buttonStyle?: string | null }) {
  const palette = getThemePalette(t);
  const accent = resolveColor(palette, "accent");
  const bookingSurface = resolveColor(palette, "formBackground");
  const bookingAccentText = contrastRatio("#000", accent, bookingSurface) >= contrastRatio("#fff", accent, bookingSurface)
    ? "#000000"
    : "#ffffff";
  const f = { ...defaultFonts, ...(t.fonts ?? {}) };
  const radius = /^[0-9.]+(rem|px)$/.test(t.radius ?? "") ? t.radius! : "0.75rem";
  const btnRadius = t.buttonStyle === "pill" ? "9999px" : t.buttonStyle === "square" ? "0px" : radius;
  const design = t.design ?? {};
  const skew = numberRange(design.buttonSkew, -25, 25);
  const textSkew = numberRange(design.buttonTextSkew, -25, 25, -skew);
  const translate = numberRange(design.buttonHoverTranslateY, -12, 12, -2);
  const vars: Record<string, string> = {
    "--font-heading": `"${safeFont(f.heading, defaultFonts.heading)}", system-ui, sans-serif`,
    "--font-body": `"${safeFont(f.body, defaultFonts.body)}", system-ui, sans-serif`,
    "--radius": radius,
    "--radius-button": btnRadius,
    "--button-skew": `${skew}deg`,
    "--button-text-skew": `${textSkew}deg`,
    "--button-hover-y": `${translate}px`,
    "--color-booking-accent": "var(--color-accent)",
    "--color-booking-accent-text": bookingAccentText,
  };
  palette.swatches.forEach((value, index) => { vars[`--theme-swatch-${index}`] = value; });
  for (const role of colorRoles) {
    const component = componentColors[role as ComponentColorRole];
    // Service card defaults historically followed the live CSS button variables.
    const cssFallback = role.startsWith("service") && role.includes("Card") && palette.roles[role] === undefined && component?.inherits;
    const index = colorIndex(palette, role);
    vars[colorVariables[role]] = cssFallback
      ? `var(${colorVariables[cssFallback]})`
      : index !== undefined
      ? `var(--theme-swatch-${index})`
      : "currentColor";
  }
  return `:root{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";")}}`;
}

export function googleFontsHref(fonts?: Partial<ThemeFonts> | null) {
  const f = { ...defaultFonts, ...(fonts ?? {}) };
  const fams = Array.from(new Set([safeFont(f.heading, defaultFonts.heading), safeFont(f.body, defaultFonts.body)]))
    .filter((font) => !customFonts[font as keyof typeof customFonts]);
  if (!fams.length) return undefined;
  return `https://fonts.googleapis.com/css2?${fams.map((x) => `family=${encodeURIComponent(x)}:wght@400;500;600;700;800`).join("&")}&display=swap`;
}

/** Font-face declarations for licensed, non-Google brand fonts selected per tenant. */
export function customFontCss(fonts?: Partial<ThemeFonts> | null) {
  const selected = new Set([safeFont(fonts?.heading, defaultFonts.heading), safeFont(fonts?.body, defaultFonts.body)]);
  return Array.from(selected).flatMap((font) => {
    const url = customFonts[font as keyof typeof customFonts];
    return url ? [`@font-face{font-family:"${font}";src:url("${url}") format("woff2");font-style:normal;font-weight:100 900;font-display:swap;}`] : [];
  }).join("\n");
}

/** Relative-luminance contrast ratio, compositing transparency over the given backdrop. */
export function contrastRatio(foreground: string, background: string, backdrop = "#ffffff") {
  function composite(value: string, base: number[]) {
    const hex = normalizeColor(value);
    if (!hex) return base;
    const alpha = hex.length === 9 ? parseInt(hex.slice(7), 16) / 255 : 1;
    return base.map((channel, index) => {
      const start = 1 + index * 2;
      return (parseInt(hex.slice(start, start + 2), 16) / 255) * alpha + channel * (1 - alpha);
    });
  }
  function luminance(rgb: number[]) {
    const [r, g, b] = rgb.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const bg = composite(background, composite(backdrop, [1, 1, 1]));
  const [lighter, darker] = [luminance(composite(foreground, bg)), luminance(bg)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}
