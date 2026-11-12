"use client";
import { useState, type CSSProperties } from "react";
import type { ThemeColors, DesignOptions } from "@platform/db";
import { contrastRatio, fontOptions } from "@platform/db/theme";
import { MediaPicker, type MediaAsset } from "./MediaPicker";

const sharedBadgeControls = [
  { slot: 1, url: "serviceBadgeOneUrl", link: "serviceBadgeOneLink", alt: "serviceBadgeOneAlt", visible: "serviceBadgeOneVisible", title: "Certification badge 1", fallbackAlt: "Certified auto repair" },
  { slot: 2, url: "serviceBadgeTwoUrl", link: "serviceBadgeTwoLink", alt: "serviceBadgeTwoAlt", visible: "serviceBadgeTwoVisible", title: "Certification badge 2", fallbackAlt: "ASE certified" },
  { slot: 3, url: "serviceBadgeThreeUrl", link: "serviceBadgeThreeLink", alt: "serviceBadgeThreeAlt", visible: "serviceBadgeThreeVisible", title: "Certification badge 3 (optional)", fallbackAlt: "Automotive certification" },
] as const;

const colorFields: [keyof ThemeColors, string, string][] = [
  ["primary", "Primary", "Default brand accent and fallback color for buttons and links."],
  ["primaryForeground", "Text on primary", "Text and icons placed on the primary brand color."],
  ["secondary", "Secondary", "Dark sections, standard footer backgrounds, and secondary emphasis."],
  ["accent", "Accent", "Highlights, small emphasis elements, and fallback badge color."],
  ["background", "Page background", "Main background used across public pages."],
  ["surface", "Panel background", "Cards, dropdown hover states, and light content panels."],
  ["text", "Body text", "Default headings and paragraph text."],
  ["muted", "Muted text", "Supporting copy, captions, and secondary information."],
];

const componentColorFields = [
  ["buttonBackground", "CTA button", "Background for Schedule Service and other main action buttons."],
  ["buttonText", "CTA button text", "Text and icons inside main action buttons."],
  ["buttonHoverBackground", "CTA hover", "Main action-button background while a visitor hovers."],
  ["buttonHoverText", "CTA hover text", "Main action-button text while a visitor hovers."],
  ["navButtonBackground", "Navigation button", "Background for the phone/call button in the website header."],
  ["navButtonText", "Navigation button text", "Phone number and hours inside the header button."],
  ["navButtonHoverBackground", "Navigation button hover", "Header phone/call button background on hover."],
  ["navButtonHoverText", "Navigation hover text", "Header phone/call button text on hover."],
  ["badgeBackground", "Badge background", "Background for small promotional or navigation badges."],
  ["badgeText", "Badge text", "Text displayed inside small badges."],
] as const;

type Props = {
  siteId: string;
  initial: { colors: ThemeColors; fonts: { heading: string; body: string }; logoUrl: string; logoDarkUrl: string; faviconUrl: string; radius: string; buttonStyle: string; customCss: string; design: DesignOptions };
  businessName: string;
  action: (fd: FormData) => Promise<void>;
  media: MediaAsset[];
  publicOrigin: string;
};

function ColorControl({ name, label, help, value, onChange }: { name: string; label: string; help: string; value: string; onChange: (value: string) => void }) {
  return <label className="block">
    <span className="label inline-flex items-center gap-1.5">{label}<span className="group relative inline-grid h-4 w-4 cursor-help place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600" tabIndex={0} aria-label={`${label}: ${help}`}>i<span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 rounded-lg bg-slate-950 px-3 py-2 text-left text-xs font-normal leading-5 text-white shadow-xl group-hover:block group-focus:block">{help}</span></span></span>
    <div className="flex gap-2"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-12 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" aria-label={`Choose ${label.toLowerCase()}`} /><input name={name} value={value} onChange={(event) => onChange(event.target.value)} className="input font-mono" pattern="#[0-9a-fA-F]{6}" /></div>
  </label>;
}

export function ThemeEditor({ siteId, initial, action, media, publicOrigin }: Props) {
  const [c, setC] = useState(initial.colors);
  const [fonts, setFonts] = useState(initial.fonts);
  const [logo, setLogo] = useState(initial.logoUrl);
  const [radius, setRadius] = useState(initial.radius);
  const [btn, setBtn] = useState(initial.buttonStyle);
  const [design, setDesign] = useState<DesignOptions>(initial.design);
  const setOption = (patch: Partial<DesignOptions>) => setDesign((old) => ({ ...old, ...patch }));
  const isHex = (value?: string) => typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
  const quoteColor = design.quoteSvgColor ?? "";
  const quoteHoverColor = design.quoteSvgHoverColor ?? "";
  const canTintQuote = isHex(quoteColor);
  const previewQuoteUrl = typeof design.quoteSvgUrl === "string" && /^\/images_nextjs\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.svg$/i.test(design.quoteSvgUrl) ? `${publicOrigin}${design.quoteSvgUrl}` : "";
  const stepIconUrl = design.serviceStepIconUrl ?? design.serviceTrustIconUrls?.[0] ?? "";
  const stepIconColor = design.serviceStepIconColor ?? design.serviceTrustIconColor ?? "";
  const stepIconHoverColor = design.serviceStepIconHoverColor ?? design.serviceTrustIconHoverColor ?? "";
  const ratio = contrastRatio(c.primary, c.primaryForeground);
  const textRatio = contrastRatio(c.text, c.background);
  const componentFallbacks: Record<(typeof componentColorFields)[number][0], string> = {
    buttonBackground: c.primary, buttonText: c.primaryForeground, buttonHoverBackground: c.primary, buttonHoverText: c.primaryForeground,
    navButtonBackground: design.buttonBackground ?? c.primary, navButtonText: design.buttonText ?? c.primaryForeground,
    navButtonHoverBackground: design.buttonHoverBackground ?? c.primary, navButtonHoverText: design.buttonHoverText ?? c.primaryForeground,
    badgeBackground: c.accent, badgeText: c.primaryForeground,
  };
  const designColor = (key: (typeof componentColorFields)[number][0]) => typeof design[key] === "string" ? design[key] as string : componentFallbacks[key];
  const buttonRatio = contrastRatio(designColor("buttonBackground"), designColor("buttonText"));
  const navButtonRatio = contrastRatio(designColor("navButtonBackground"), designColor("navButtonText"));

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="siteId" value={siteId} />
      <div className="space-y-6">
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Logo & icons</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <MediaPicker siteId={siteId} name="logoUrl" label="Main logo" value={logo} assets={media} publicOrigin={publicOrigin} maxWidth={800} className="sm:col-span-2" onChange={setLogo} />
            <MediaPicker siteId={siteId} name="logoDarkUrl" label="Logo for dark backgrounds" value={initial.logoDarkUrl} assets={media} publicOrigin={publicOrigin} maxWidth={800} />
            <MediaPicker siteId={siteId} name="faviconUrl" label="Favicon" value={initial.faviconUrl} assets={media} publicOrigin={publicOrigin} maxWidth={256} />
          </div>
          <p className="help mt-2">Choose an image from this site’s media library or upload a new optimized image.</p>
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4"><h2 className="font-semibold">Complete colour scheme</h2><p className="mt-1 text-sm text-slate-500">All website colors are managed here. Hover or focus the information icon beside any color to see exactly where it is used.</p></div>
          <div className="p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Foundation colors</h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {colorFields.map(([key, label, help]) => <ColorControl key={key} name={key} label={label} help={help} value={c[key]} onChange={(value) => setC({ ...c, [key]: value })} />)}
          </div>
          <div className="my-6 border-t border-slate-200" />
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Buttons, navigation &amp; badges</h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {componentColorFields.map(([key, label, help]) => <ColorControl key={key} name={key} label={label} help={help} value={designColor(key)} onChange={(value) => setOption({ [key]: value })} />)}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <Contrast label="Primary contrast" ratio={ratio} />
            <Contrast label="Body text contrast" ratio={textRatio} />
            <Contrast label="CTA contrast" ratio={buttonRatio} />
            <Contrast label="Navigation button contrast" ratio={navButtonRatio} />
          </div>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Typography & shape</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="label">Heading font</span><select name="fontHeading" value={fonts.heading} onChange={(e) => setFonts({ ...fonts, heading: e.target.value })} className="input">{fontOptions.map((f) => <option key={f}>{f}</option>)}</select></label>
            <label className="block"><span className="label">Body font</span><select name="fontBody" value={fonts.body} onChange={(e) => setFonts({ ...fonts, body: e.target.value })} className="input">{fontOptions.map((f) => <option key={f}>{f}</option>)}</select></label>
            <label className="block"><span className="label">Corner radius</span><select name="radius" value={radius} onChange={(e) => setRadius(e.target.value)} className="input">{["0rem", "0.25rem", "0.5rem", "0.75rem", "1rem", "1.5rem"].map((r) => <option key={r}>{r}</option>)}</select></label>
            <label className="block"><span className="label">Button style</span><select name="buttonStyle" value={btn} onChange={(e) => setBtn(e.target.value)} className="input"><option value="rounded">Rounded</option><option value="pill">Pill</option><option value="square">Square</option></select></label>
          </div>
          <div className="mt-5 border-t border-slate-200 pt-4">
            <h3 className="mb-3 font-semibold">Header layout, shared assets &amp; button shape</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="label">Home hero layout</span><select name="heroStyle" value={design.heroStyle ?? (design.headerStyle === "angled" ? "micks-overlay" : "classic")} onChange={(e) => setOption({ heroStyle: e.target.value as "classic" | "micks-overlay" })} className="input"><option value="classic">Standard hero</option><option value="micks-overlay">Mick's overlay hero with trust cards</option></select></label>
              <label className="block"><span className="label">Header style</span><select name="headerStyle" value={design.headerStyle ?? "standard"} onChange={(e) => setOption({ headerStyle: e.target.value as "standard" | "angled" })} className="input"><option value="standard">Standard</option><option value="angled">Mick's angled header</option></select></label>
              <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-1 font-semibold">Quote decoration SVG</h4>
                <p className="help mb-3">Upload the quote artwork used by this website in the About section and service-page quotations. The change applies to every matching quote decoration on this site only. Leave empty to keep the default // decoration.</p>
                <MediaPicker siteId={siteId} name="quoteSvgUrl" label="Quote SVG (per website)" value={design.quoteSvgUrl ?? ""} onChange={(url) => setOption({ quoteSvgUrl: url })} assets={media} publicOrigin={publicOrigin} svgOnly help="Upload a static SVG (up to 512 KB). It remains an SVG and is saved to this website's media library." />
                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr]">
                  <div className="space-y-3">
                    <label className="block">
                      <span className="label">SVG Color</span>
                      <div className="flex gap-2">
                        <input type="color" aria-label="Select quote SVG color" className="h-9 w-12 cursor-pointer rounded border border-slate-300" value={canTintQuote ? quoteColor : "#7198bd"} onChange={(event) => setOption({ quoteSvgColor: event.target.value })} />
                        <input className="input font-mono" name="quoteSvgColor" value={quoteColor} onChange={(event) => setOption({ quoteSvgColor: event.target.value })} pattern="#[0-9a-fA-F]{6}" placeholder="Original SVG colors" aria-label="Quote SVG hex color" />
                      </div>
                    </label>
                    <label className="block">
                      <span className="label">SVG Hover Color</span>
                      <div className="flex gap-2">
                        <input type="color" aria-label="Select quote SVG hover color" className="h-9 w-12 cursor-pointer rounded border border-slate-300 disabled:cursor-not-allowed disabled:opacity-40" disabled={!canTintQuote} value={isHex(quoteHoverColor) ? quoteHoverColor : canTintQuote ? quoteColor : "#7198bd"} onChange={(event) => setOption({ quoteSvgHoverColor: event.target.value })} />
                        <input className="input font-mono" name="quoteSvgHoverColor" value={quoteHoverColor} disabled={!canTintQuote} onChange={(event) => setOption({ quoteSvgHoverColor: event.target.value })} pattern="#[0-9a-fA-F]{6}" placeholder="Same as SVG color" aria-label="Quote SVG hover hex color" />
                      </div>
                    </label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOption({ quoteSvgColor: undefined, quoteSvgHoverColor: undefined })}>Reset Color (original SVG)</button>
                    <p className="help">Choosing a color applies one solid color to the entire SVG, including its strokes. Reset restores the file's original colors. Hover applies when the quote icon is hovered.</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="label">Live preview</p>
                    <div className="flex min-h-28 items-center justify-center bg-slate-50 rounded">
                      {previewQuoteUrl ? (canTintQuote ? <span role="img" aria-label="Tinted quote SVG preview" className="block h-20 w-20 bg-[var(--preview-quote-color)] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center] [-webkit-mask-size:contain] [-webkit-mask-repeat:no-repeat] [-webkit-mask-position:center]" style={{ "--preview-quote-color": quoteColor, maskImage: `url("${previewQuoteUrl}")`, WebkitMaskImage: `url("${previewQuoteUrl}")` } as CSSProperties} /> : <img src={previewQuoteUrl} className="h-20 w-20 object-contain" alt="Original quote SVG preview" />) : <span className="text-xs text-slate-400">Upload an SVG to preview its color</span>}
                    </div>
                    <p className="help mt-2">{canTintQuote ? `Selected tint: ${quoteColor}` : "Original SVG colors"}</p>
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4">
                  <h4 className="font-semibold">Service Step List Icon</h4>
                  <p className="help">Upload one static SVG. It is automatically used for every item in every service step list, including the trust list, at 57 × 57 px on desktop.</p>
                </div>
                <MediaPicker siteId={siteId} name="serviceStepIconUrl" label="Shared step-list SVG" value={stepIconUrl} onChange={(url) => setOption({ serviceStepIconUrl: url })} assets={media} publicOrigin={publicOrigin} svgOnly help="Choose an existing site SVG or upload a safe static SVG once for all service step-list items." />
                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_220px]">
                  <label><span className="label">SVG Color</span><div className="flex gap-2"><input type="color" className="h-10 w-12 rounded border" value={isHex(stepIconColor) ? stepIconColor : "#0c1b2a"} onChange={(event) => setOption({ serviceStepIconColor: event.target.value })} /><input name="serviceStepIconColor" className="input font-mono" value={stepIconColor} onChange={(event) => setOption({ serviceStepIconColor: event.target.value })} placeholder="Original colors" pattern="#[0-9a-fA-F]{6}" /></div></label>
                  <label><span className="label">Hover Color</span><div className="flex gap-2"><input type="color" className="h-10 w-12 rounded border disabled:opacity-40" disabled={!isHex(stepIconColor)} value={isHex(stepIconHoverColor) ? stepIconHoverColor : isHex(stepIconColor) ? stepIconColor : "#0c1b2a"} onChange={(event) => setOption({ serviceStepIconHoverColor: event.target.value })} /><input name="serviceStepIconHoverColor" className="input font-mono" disabled={!isHex(stepIconColor)} value={stepIconHoverColor} onChange={(event) => setOption({ serviceStepIconHoverColor: event.target.value })} placeholder="Same as SVG color" pattern="#[0-9a-fA-F]{6}" /></div></label>
                  <div><span className="label">Actions</span><button type="button" className="btn btn-secondary w-full" onClick={() => setOption({ serviceStepIconColor: "", serviceStepIconHoverColor: "" })}>Reset to original colors</button></div>
                </div>
                <div className="mt-4 rounded-lg border bg-white p-3"><p className="label">Live preview</p><div className="flex items-center gap-4"><div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-lg bg-slate-100">{stepIconUrl ? (isHex(stepIconColor) ? <span className="h-[57px] w-[57px]" style={{ backgroundColor: stepIconColor, mask: `url(${publicOrigin}${stepIconUrl}) center/contain no-repeat`, WebkitMask: `url(${publicOrigin}${stepIconUrl}) center/contain no-repeat` }} /> : <img src={`${publicOrigin}${stepIconUrl}`} alt="Shared service step-list icon" className="h-[57px] w-[57px] object-contain" />) : <span className="text-xs text-slate-400">Fallback</span>}</div><p className="help">This previewed icon is applied to every row inside <code>.micks-service-step-list</code> across the selected website.</p></div></div>
              </div>
              <MediaPicker siteId={siteId} name="innerHeroImageUrl" label="Inner-page banner" value={design.innerHeroImageUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={1920} className="sm:col-span-2" />
              <MediaPicker siteId={siteId} name="serviceDefaultImageUrl" label="Default service-page image" value={design.serviceDefaultImageUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={1400} className="sm:col-span-2" />
              <div className="sm:col-span-2 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                <h4 className="font-semibold text-slate-900">Certification badges - shared across this website</h4>
                <p className="help mb-4 mt-1">Upload each badge once. Changing its image, link, description or visibility automatically updates the homepage hero, homepage About section, About page, service details and footer. A third badge is optional. Each website has its own settings.</p>
                <div className="grid gap-4 lg:grid-cols-3">
                  {sharedBadgeControls.map((badge) => (
                    <div key={badge.slot} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="mb-2 flex items-center justify-between gap-2"><h5 className="text-sm font-semibold">{badge.title}</h5><span className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-500">Slot {badge.slot}</span></div>
                      <MediaPicker siteId={siteId} name={badge.url} label="Badge image (SVG, WebP or PNG)" value={design[badge.url] ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={400} preserveSvg onChange={(url) => setOption({ [badge.url]: url })} />
                      <label className="mt-3 block"><span className="label">Click-through URL (optional)</span><input name={badge.link} className="input" value={design[badge.link] ?? ""} onChange={(event) => setOption({ [badge.link]: event.target.value })} placeholder="https://example.com" /></label>
                      <label className="mt-3 block"><span className="label">Image description</span><input name={badge.alt} className="input" value={design[badge.alt] ?? badge.fallbackAlt} onChange={(event) => setOption({ [badge.alt]: event.target.value })} /></label>
                      <label className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm font-medium"><input type="checkbox" name={badge.visible} checked={design[badge.visible] ?? true} onChange={(event) => setOption({ [badge.visible]: event.target.checked })} />Show on every page</label>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                  <p className="label">Live badge alignment preview</p>
                  <div className="flex min-h-[96px] flex-wrap items-center justify-center gap-4">
                    {sharedBadgeControls.filter((badge) => Boolean(design[badge.url]) && design[badge.visible] !== false).map((badge) => {
                      const url = design[badge.url] ?? "";
                      return <img key={badge.slot} src={url.startsWith("/") ? `${publicOrigin}${url}` : url} alt={design[badge.alt] || badge.fallbackAlt} className="h-[82px] w-[82px] shrink-0 object-contain" />;
                    })}
                    {sharedBadgeControls.every((badge) => !design[badge.url] || design[badge.visible] === false) && <p className="text-xs text-slate-500">No badges are currently visible. Upload a badge and turn on “Show on every page”.</p>}
                  </div>
                  <p className="help mt-2 text-center">Changes appear here immediately. Click Save branding to update all public sections.</p>
                </div>
              </div>
              <MediaPicker siteId={siteId} name="serviceProcessImageUrl" label="Service process image" value={design.serviceProcessImageUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={1200} />
              <MediaPicker siteId={siteId} name="serviceTrustImageUrl" label="Service trust image" value={design.serviceTrustImageUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={1200} />
              <MediaPicker siteId={siteId} name="serviceVehicleImageUrl" label="Service vehicle image" value={design.serviceVehicleImageUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={1000} />
              <MediaPicker siteId={siteId} name="footerBackgroundImageUrl" label="Footer background" value={design.footerBackgroundImageUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={1920} className="sm:col-span-2" />
              <MediaPicker siteId={siteId} name="footerPoweredLogoUrl" label="Powered by logo" value={design.footerPoweredLogoUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={600} />
              <label className="block"><span className="label">Powered by link</span><input name="footerPoweredLink" className="input" value={design.footerPoweredLink ?? ""} onChange={(event) => setOption({ footerPoweredLink: event.target.value })} placeholder="https://www.raiseahood.com" /></label>
              <label className="block"><span className="label">Powered by text</span><input name="footerPoweredText" className="input" value={design.footerPoweredText ?? ""} onChange={(event) => setOption({ footerPoweredText: event.target.value })} placeholder="Powered by Raise a Hood" /></label>
              <label className="block"><span className="label">Facebook link text</span><input name="footerFacebookText" className="input" value={design.footerFacebookText ?? ""} onChange={(event) => setOption({ footerFacebookText: event.target.value })} placeholder="Follow us on Facebook" /></label>
              <MediaPicker siteId={siteId} name="aboutOwnerImageUrl" label="About owner image" value={design.aboutOwnerImageUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={1200} />
              <MediaPicker siteId={siteId} name="aboutTeamImageUrl" label="About team image" value={design.aboutTeamImageUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={1600} />
              <MediaPicker siteId={siteId} name="aboutVehicleImageUrl" label="About vehicle image" value={design.aboutVehicleImageUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={1200} />
              <MediaPicker siteId={siteId} name="aboutCrewImageOneUrl" label="Crew image 1" value={design.aboutCrewImageOneUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={900} />
              <MediaPicker siteId={siteId} name="aboutCrewImageTwoUrl" label="Crew image 2" value={design.aboutCrewImageTwoUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={900} />
              <MediaPicker siteId={siteId} name="aboutCrewImageThreeUrl" label="Crew image 3" value={design.aboutCrewImageThreeUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={900} />
              <label className="block sm:col-span-2"><span className="label">About page work-process items</span><textarea name="aboutWorkItems" className="input" rows={5} defaultValue={(design.aboutWorkItems ?? []).map((item) => `${item.title} | ${item.body}`).join("\n")} placeholder="Straight-Talk Quotes | No surprise add-ons; you approve every line." /><span className="help">One item per line in display order: heading | description. Each item reuses the shared step-list SVG and colors.</span></label>
              <MediaPicker siteId={siteId} name="diagnosticsImageUrl" label="Diagnostics feature image" value={design.diagnosticsImageUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={1400} />
              <MediaPicker siteId={siteId} name="tiresImageUrl" label="Tires feature image" value={design.tiresImageUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={1400} />
              <input type="hidden" name="scheduleCtaHref" value={design.scheduleCtaHref ?? "/make-an-appointment/"} />
              <input type="hidden" name="diagnosticsCtaHref" value={design.diagnosticsCtaHref ?? "/diagnostics/"} />
              <input type="hidden" name="tiresCtaHref" value={design.tiresCtaHref ?? "/tires/"} />
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900 sm:col-span-2">Repeated button destinations are managed once in <a className="font-semibold underline" href={`/sites/${siteId}/global`}>Global settings</a>.</div>
              <label className="block"><span className="label">Button skew (-25 to 25 deg)</span><input name="buttonSkew" type="number" className="input" min={-25} max={25} value={design.buttonSkew ?? 0} onChange={(e) => setOption({ buttonSkew: Number(e.target.value) })} /><span className="help">Controls the angle of the button shape.</span></label>
              <label className="block"><span className="label">Button text skew (-25 to 25 deg)</span><input name="buttonTextSkew" type="number" className="input" min={-25} max={25} value={design.buttonTextSkew ?? -(design.buttonSkew ?? 0)} onChange={(e) => setOption({ buttonTextSkew: Number(e.target.value) })} /><span className="help">Controls the text angle separately. Use the opposite value to keep text visually straight.</span></label>
              <label className="block"><span className="label">Button hover movement (px)</span><input name="buttonHoverTranslateY" type="number" className="input" min={-12} max={12} value={design.buttonHoverTranslateY ?? -2} onChange={(e) => setOption({ buttonHoverTranslateY: Number(e.target.value) })} /></label>
            </div>
          </div>
          <label className="mt-4 block"><span className="label">Custom CSS (advanced)</span><textarea name="customCss" defaultValue={initial.customCss} rows={4} className="input font-mono text-xs" /></label>
        </section>
        <button className="btn btn-primary">Save branding</button>
      </div>


    </form>
  );
}

function Contrast({ label, ratio }: { label: string; ratio: number }) {
  const ok = ratio >= 4.5;
  return <span className={`rounded-full px-2.5 py-1 font-semibold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{label}: {ratio.toFixed(1)}:1 {ok ? "✓ readable" : "⚠ below 4.5:1"}</span>;
}
