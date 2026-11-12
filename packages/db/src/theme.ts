import type { ThemeColors, ThemeFonts, DesignOptions } from "./schema";

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
};

export const defaultFonts: ThemeFonts = { heading: "Montserrat", body: "Inter" };

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const safeColor = (v: string | undefined, fallback: string) => (v && HEX.test(v) ? v : fallback);
const safeFont = (f: string | undefined, fallback: string) =>
  f && (fontOptions as readonly string[]).includes(f) ? f : fallback;

/** Builds CSS variables from an allowlisted set of design options (never raw input). */
export function getDesign(t?: { design?: DesignOptions | null }): DesignOptions { return t?.design ?? {}; }
const numberRange = (n: number | undefined, min: number, max: number, defaultValue = 0) =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, n!)) : defaultValue;

/** Builds the :root CSS variable block injected into every page of a site. */
export function themeToCss(t: { colors?: Partial<ThemeColors> | null; fonts?: Partial<ThemeFonts> | null; radius?: string | null; buttonStyle?: string | null; design?: DesignOptions | null }) {
  const c = { ...defaultColors, ...(t.colors ?? {}) };
  const f = { ...defaultFonts, ...(t.fonts ?? {}) };
  const radius = /^[0-9.]+(rem|px)$/.test(t.radius ?? "") ? t.radius! : "0.75rem";
  const btnRadius = t.buttonStyle === "pill" ? "9999px" : t.buttonStyle === "square" ? "0px" : radius;
  const design = getDesign(t);
  const skew = numberRange(design.buttonSkew, -25, 25);
  const textSkew = numberRange(design.buttonTextSkew, -25, 25, -skew);
  const translate = numberRange(design.buttonHoverTranslateY, -12, 12, -2);
  const vars: Record<string, string> = {
    "--color-primary": safeColor(c.primary, defaultColors.primary),
    "--color-primary-foreground": safeColor(c.primaryForeground, defaultColors.primaryForeground),
    "--color-secondary": safeColor(c.secondary, defaultColors.secondary),
    "--color-accent": safeColor(c.accent, defaultColors.accent),
    "--color-background": safeColor(c.background, defaultColors.background),
    "--color-surface": safeColor(c.surface, defaultColors.surface),
    "--color-text": safeColor(c.text, defaultColors.text),
    "--color-muted": safeColor(c.muted, defaultColors.muted),
    "--font-heading": `"${safeFont(f.heading, defaultFonts.heading)}", system-ui, sans-serif`,
    "--font-body": `"${safeFont(f.body, defaultFonts.body)}", system-ui, sans-serif`,
    "--radius": radius,
    "--radius-button": btnRadius,
    "--button-bg": safeColor(design.buttonBackground, c.primary),
    "--button-text": safeColor(design.buttonText, c.primaryForeground),
    "--button-hover-bg": safeColor(design.buttonHoverBackground, c.primary),
    "--button-hover-text": safeColor(design.buttonHoverText, c.primaryForeground),
    "--nav-button-bg": safeColor(design.navButtonBackground, safeColor(design.buttonBackground, c.primary)),
    "--nav-button-text": safeColor(design.navButtonText, safeColor(design.buttonText, c.primaryForeground)),
    "--nav-button-hover-bg": safeColor(design.navButtonHoverBackground, safeColor(design.buttonHoverBackground, c.primary)),
    "--nav-button-hover-text": safeColor(design.navButtonHoverText, safeColor(design.buttonHoverText, c.primaryForeground)),
    "--button-skew": `${skew}deg`,
    "--button-text-skew": `${textSkew}deg`,
    "--button-hover-y": `${translate}px`,
    "--badge-bg": safeColor(design.badgeBackground, c.accent),
    "--badge-text": safeColor(design.badgeText, c.primaryForeground),
  };
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

/** WCAG relative-luminance contrast ratio, used by the admin colour picker. */
export function contrastRatio(a: string, b: string) {
  const lum = (hex: string) => {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map((x) => x + x).join("");
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
