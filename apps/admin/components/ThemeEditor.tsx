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

const colorFields: [keyof ThemeColors, string][] = [
  ["primary", "Primary (buttons, accents)"],
  ["primaryForeground", "Text on primary"],
  ["secondary", "Secondary (dark sections, footer)"],
  ["accent", "Accent (highlights)"],
  ["background", "Page background"],
  ["surface", "Panel background"],
  ["text", "Body text"],
  ["muted", "Muted text"],
];

type Props = {
  siteId: string;
  initial: { colors: ThemeColors; fonts: { heading: string; body: string }; logoUrl: string; logoDarkUrl: string; faviconUrl: string; radius: string; buttonStyle: string; customCss: string; design: DesignOptions };
  businessName: string;
  action: (fd: FormData) => Promise<void>;
  media: MediaAsset[];
  publicOrigin: string;
};

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

        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Colour scheme</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {colorFields.map(([k, label]) => (
              <label key={k} className="block">
                <span className="label">{label}</span>
                <div className="flex gap-2">
                  <input type="color" value={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-slate-300" aria-label={label} />
                  <input name={k} value={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.value })} className="input font-mono" pattern="#[0-9a-fA-F]{6}" />
                </div>
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <Contrast label="Button text contrast" ratio={ratio} />
            <Contrast label="Body text contrast" ratio={textRatio} />
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
            <h3 className="mb-3 font-semibold">Header, badges and buttons</h3>
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
              <MediaPicker siteId={siteId} name="aboutOwnerImageUrl" label="About owner image" value={design.aboutOwnerImageUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={1200} />
              <MediaPicker siteId={siteId} name="aboutTeamImageUrl" label="About team image" value={design.aboutTeamImageUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={1600} />
              <MediaPicker siteId={siteId} name="aboutVehicleImageUrl" label="About vehicle image" value={design.aboutVehicleImageUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={1200} />
              <MediaPicker siteId={siteId} name="aboutCrewImageOneUrl" label="Crew image 1" value={design.aboutCrewImageOneUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={900} />
              <MediaPicker siteId={siteId} name="aboutCrewImageTwoUrl" label="Crew image 2" value={design.aboutCrewImageTwoUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={900} />
              <MediaPicker siteId={siteId} name="aboutCrewImageThreeUrl" label="Crew image 3" value={design.aboutCrewImageThreeUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={900} />
              <MediaPicker siteId={siteId} name="diagnosticsImageUrl" label="Diagnostics feature image" value={design.diagnosticsImageUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={1400} />
              <MediaPicker siteId={siteId} name="tiresImageUrl" label="Tires feature image" value={design.tiresImageUrl ?? ""} assets={media} publicOrigin={publicOrigin} maxWidth={1400} />
              <input type="hidden" name="scheduleCtaHref" value={design.scheduleCtaHref ?? "/make-an-appointment/"} />
              <input type="hidden" name="diagnosticsCtaHref" value={design.diagnosticsCtaHref ?? "/diagnostics/"} />
              <input type="hidden" name="tiresCtaHref" value={design.tiresCtaHref ?? "/tires/"} />
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900 sm:col-span-2">Repeated button destinations are managed once in <a className="font-semibold underline" href={`/sites/${siteId}/global`}>Global settings</a>.</div>
              <label className="block"><span className="label">Button skew (-25 to 25 deg)</span><input name="buttonSkew" type="number" className="input" min={-25} max={25} value={design.buttonSkew ?? 0} onChange={(e) => setOption({ buttonSkew: Number(e.target.value) })} /></label>
              <label className="block"><span className="label">Button hover movement (px)</span><input name="buttonHoverTranslateY" type="number" className="input" min={-12} max={12} value={design.buttonHoverTranslateY ?? -2} onChange={(e) => setOption({ buttonHoverTranslateY: Number(e.target.value) })} /></label>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {([
                ["buttonBackground", "Button background", c.primary],
                ["buttonText", "Button text", c.primaryForeground],
                ["buttonHoverBackground", "Button hover background", c.primary],
                ["buttonHoverText", "Button hover text", c.primaryForeground],
                ["badgeBackground", "Badge background", c.accent],
                ["badgeText", "Badge text", c.primaryForeground],
              ] as const).map(([key, label, fallback]) => (
                <label key={key} className="block"><span className="label">{label}</span><div className="flex gap-2"><input type="color" className="h-9 w-12 rounded border" value={design[key] ?? fallback} onChange={(e) => setOption({ [key]: e.target.value })} /><input className="input font-mono" name={key} pattern="#[0-9a-fA-F]{6}" value={design[key] ?? fallback} onChange={(e) => setOption({ [key]: e.target.value })} /></div></label>
              ))}
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
