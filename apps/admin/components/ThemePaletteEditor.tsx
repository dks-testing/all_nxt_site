"use client";

import { useId, useState } from "react";
import type { ThemePalette } from "@platform/db";
import { colorIndex, colorPattern, colorRoles, componentColors, contrastRatio, normalizeColor, paletteColor, resolveColor, type ColorRole } from "@platform/db/theme";

const descriptions = {
  primary: ["Primary", "Brand links, highlights, focus outlines and default action backgrounds."],
  secondary: ["Secondary", "Navigation text, dark buttons and the standard footer background."],
  accent: ["Accent", "Highlights and the default badge background."],
  background: ["Page background", "Main background across public pages."],
  surface: ["Section surface", "Light content panels, cards and dropdown hover backgrounds."],
  testimonialsBackground: ["Testimonials background", "Background of the testimonials section."],
  footerLogoBandBackground: ["Footer logo band", "Background behind the footer logo and certification badges."],
  featurePanel: ["Feature panels", "Diagnostics and tires callouts, the default feature gradient tint and the crew card focus outline."],
  featureHighlight: ["Section highlights", "Quote marks, case study image frames, and featured links and offers."],
  text: ["Main text", "Default heading and body text."],
  muted: ["Muted text", "Supporting copy and secondary information."],
  primaryForeground: ["Text on primary", "Default text and icons for action buttons and badges, and trust/value card headings."],
  buttonBackground: ["Action background", "Schedule Service and other main action buttons."],
  buttonText: ["Action text", "Text and icons on main action buttons."],
  buttonHoverBackground: ["Action hover background", "Main action-button background on hover."],
  buttonHoverText: ["Action hover text", "Main action-button text on hover."],
  navButtonBackground: ["Header phone background", "Background of the header phone button."],
  navButtonText: ["Header phone text", "Phone number and hours inside the header button."],
  navButtonHoverBackground: ["Header phone hover background", "Header phone-button background on hover."],
  navButtonHoverText: ["Header phone hover text", "Header phone-button text on hover."],
  badgeBackground: ["Badge background", "Background of small promotional or navigation badges."],
  badgeText: ["Badge text", "Text inside small badges."],
  trustCardHoverBackground: ["Value card hover background", "Background on hover for trust/value cards."],
  trustCardHeadingColor: ["Value card heading text", "Heading colour on trust/value cards."],
  serviceProcessCardBackground: ["Process card background", "Background of process steps on service detail pages."],
  serviceProcessCardHoverBackground: ["Process card hover background", "Background on hover for service process steps."],
  serviceProcessCardTextColor: ["Service card text", "Titles and descriptions on service process and trust cards."],
  serviceTrustCardBackground: ["Trust card background", "Background of trust cards on service detail pages."],
  serviceTrustCardHoverBackground: ["Trust card hover background", "Background on hover for service trust cards."],
  accentColor: ["Booking accent", "Booking buttons, selection indicators and icons."],
  accentTextColor: ["Booking accent text", "Text on booking accents."],
  formBackground: ["Booking form surface", "Background of the booking form."],
  inputBackground: ["Booking input surface", "Background of booking form fields."],
  formTextColor: ["Booking form text", "Text on the booking form."],
  inputTextColor: ["Booking input text", "Text in booking form fields."],
  quoteSvgColor: ["Quote SVG tint", "Colour applied to the uploaded quote artwork."],
  quoteSvgHoverColor: ["Quote SVG hover tint", "Colour applied when the quote artwork is hovered."],
  serviceStepIconColor: ["Step icon tint", "Colour applied to uploaded service step icons."],
  serviceStepIconHoverColor: ["Step icon hover tint", "Colour applied when a service step is hovered."],
} satisfies Record<ColorRole, [string, string]>;

const globalGroups = [
  { title: "Primary", roles: ["primary", "buttonBackground", "buttonHoverBackground", "navButtonBackground", "navButtonHoverBackground", "accentColor"] },
  { title: "Secondary", roles: ["secondary", "accent", "badgeBackground", "featureHighlight", "quoteSvgColor", "quoteSvgHoverColor", "serviceStepIconColor", "serviceStepIconHoverColor"] },
  { title: "Section / Surface", roles: ["background", "surface", "testimonialsBackground", "footerLogoBandBackground", "featurePanel", "formBackground", "inputBackground", "trustCardHoverBackground", "serviceProcessCardBackground", "serviceProcessCardHoverBackground", "serviceTrustCardBackground", "serviceTrustCardHoverBackground"] },
  { title: "Text", roles: ["text", "muted", "primaryForeground", "buttonText", "buttonHoverText", "navButtonText", "navButtonHoverText", "badgeText", "trustCardHeadingColor", "serviceProcessCardTextColor", "accentTextColor", "formTextColor", "inputTextColor"] },
] as const satisfies ReadonlyArray<{ title: string; roles: readonly ColorRole[] }>;

const contrastPairs = [
  ["Body text", "text", "background"],
  ["Muted text", "muted", "background"],
  ["Text on primary", "primaryForeground", "primary"],
  ["Main action", "buttonText", "buttonBackground"],
  ["Action hover", "buttonHoverText", "buttonHoverBackground"],
  ["Header phone", "navButtonText", "navButtonBackground"],
  ["Phone hover", "navButtonHoverText", "navButtonHoverBackground"],
  ["Badge", "badgeText", "badgeBackground"],
] as const;

export function ThemePaletteEditor({ palette, onChange }: { palette: ThemePalette; onChange: (value: ThemePalette) => void }) {
  const [selectedRole, selectRole] = useState<ColorRole | "">("");
  const id = useId();
  const representatives: ColorRole[] = ["primary", "secondary", "background", "text", ...globalGroups.flatMap(({ roles }) => roles)];
  const roleBySwatch = new Map<number, ColorRole>();
  for (const role of representatives) {
    const index = palette.roles[role];
    if (index !== undefined && !roleBySwatch.has(index)) roleBySwatch.set(index, role);
  }

  function customize(role: ColorRole) {
    const value = normalizeColor(resolveColor(palette, role)) ?? resolveColor(palette, "text");
    onChange({ ...palette, swatches: [...palette.swatches, value], roles: { ...palette.roles, [role]: palette.swatches.length } });
  }

  function swatchControl(role: ColorRole, index: number) {
    const [label] = descriptions[role];
    const value = palette.swatches[index];
    const uses = colorRoles.filter((other) => colorIndex(palette, other) === index);
    const inputId = `${id}-${index}`;
    function setColor(next: string) {
      onChange({ ...palette, swatches: palette.swatches.map((colour, i) => i === index ? next : colour) });
    }
    return (
      <div key={index} className="min-w-0">
        <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor={inputId}>{label}</label>
        <div className="flex gap-2">
          <input type="color" value={normalizeColor(value)?.slice(0, 7) ?? "#000000"} onChange={(event) => setColor(event.target.value)} className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" aria-label={`Choose ${label.toLowerCase()}`} />
          <input id={inputId} value={value} onChange={(event) => setColor(event.target.value)} className="input min-w-0 font-mono" pattern={colorPattern} required />
        </div>
        <details className="mt-1.5 text-xs text-slate-600">
          <summary className="cursor-pointer">Used by {uses.length === 1 ? label.toLowerCase() : `${uses.length} colour roles`}</summary>
          <ul className="mt-2 space-y-1.5">
            {uses.map((use) => <li key={use}><span className="font-semibold">{descriptions[use][0]}.</span> {descriptions[use][1]}</li>)}
          </ul>
        </details>
      </div>
    );
  }

  const selectedComponent = selectedRole ? componentColors[selectedRole as keyof typeof componentColors] : undefined;

  return (
    <section className="card">
      <input type="hidden" name="palette" value={JSON.stringify({ roles: palette.roles, swatches: palette.swatches })} />
      <header className="rounded-t-xl border-b border-slate-200 bg-slate-50/70 px-5 py-4">
        <h2 className="font-semibold">Global colour palette</h2>
        <p className="mt-1 text-sm text-slate-600">Each swatch is listed once. Open its usage list to see which colours change together.</p>
      </header>
      <div className="divide-y divide-slate-200 px-5">
        {globalGroups.map(({ title, roles }) => {
          const swatches = [...roleBySwatch].filter(([, role]) => (roles as readonly ColorRole[]).includes(role));
          return (
            <div key={title} className="space-y-3 py-5">
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              {swatches.length ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{swatches.map(([index, role]) => swatchControl(role, index))}</div>
              ) : (
                <p className="text-sm text-slate-600">These colours use swatches listed above.</p>
              )}
            </div>
          );
        })}
        <details className="py-5">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">Separate a colour or restore its default</summary>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="w-full max-w-xs">
              <span className="label">Colour role</span>
              <select className="input" value={selectedRole} onChange={(event) => selectRole(event.target.value as ColorRole | "")}>
                <option value="">Choose a colour role</option>
                {globalGroups.map(({ title, roles }) => <optgroup key={title} label={title}>{roles.map((role) => <option key={role} value={role}>{descriptions[role][0]}</option>)}</optgroup>)}
              </select>
            </label>
            <button type="button" className="btn btn-secondary" disabled={!selectedRole} onClick={() => { if (selectedRole) customize(selectedRole); }}>Create separate swatch</button>
            {selectedRole && selectedComponent && paletteColor(palette, selectedRole) !== undefined && (
              <button type="button" className="btn btn-secondary" onClick={() => {
                const roles = { ...palette.roles };
                delete roles[selectedRole];
                onChange({ ...palette, roles });
              }}>Restore default</button>
            )}
          </div>
        </details>
        <div className="space-y-3 py-5">
          <h3 className="text-sm font-semibold text-slate-900">Text contrast</h3>
          <ul className="flex flex-wrap gap-2 text-xs">
            {contrastPairs.map(([label, foreground, background]) => {
              const backdrop = background === "background" ? undefined : resolveColor(palette, "background");
              const ratio = contrastRatio(resolveColor(palette, foreground), resolveColor(palette, background), backdrop);
              return <li key={label} className={`rounded-md px-2.5 py-1.5 font-medium ${ratio >= 4.5 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{label} {ratio.toFixed(1)}∶1{ratio < 4.5 && " · below 4.5∶1"}</li>;
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
