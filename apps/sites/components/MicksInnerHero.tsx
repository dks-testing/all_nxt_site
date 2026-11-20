import Link from "next/link";
import type { SiteBundle } from "@platform/db";
import { getDesign } from "@platform/db/theme";
import { formatAddress, telHref } from "@/lib/format";
import { localSiteHref } from "@/lib/url";
import { PhoneIcon, PinIcon } from "./Icons";
import { globalCta, smartToolUrl } from "@/lib/global-content";
import { ToolPopupLink } from "./ToolPopupLink";

type Cta = { label: string; href: string };

export function MicksInnerHero({ bundle, heading, primaryCta, imageUrl, variant = "page" }: { bundle: SiteBundle; heading: string; primaryCta?: Cta; imageUrl?: string | null; variant?: "page" | "service" }) {
  const design = getDesign(bundle.theme ?? {});
  const settings = bundle.settings;
  const background = imageUrl || design.innerHeroImageUrl;
  const address = formatAddress(settings?.address);
  const scheduleSource = primaryCta ?? { label: "Schedule Service", href: "/make-an-appointment/#book" };
  const schedule = globalCta(design, scheduleSource.href, scheduleSource.label);
  if (variant === "page") {
    const actions: { label: string; href: string; tool?: "diagnostics" | "tires" }[] = [
      { ...globalCta(design, design.scheduleCtaHref || "/make-an-appointment/", design.scheduleCtaLabel || "Schedule Service") },
      { ...globalCta(design, design.diagnosticsCtaHref || "/diagnostics/", design.diagnosticsCtaLabel || "Start Diagnostics"), tool: "diagnostics" as const },
      { ...globalCta(design, design.tiresCtaHref || "/tires/", design.tiresCtaLabel || "Find the Right Tires"), tool: "tires" as const },
    ];
    return <section className="micks-inner-hero micks-shared-banner" style={background ? { backgroundImage: `linear-gradient(rgba(0,0,0,.68),rgba(0,0,0,.68)),url(${JSON.stringify(background)})` } : undefined}>
      <div className="container-site micks-inner-hero-content">
        <h1>{heading}</h1>
        <div className="micks-shared-banner-actions">{actions.map((action) => action.tool
          ? <ToolPopupLink key={action.tool} href={localSiteHref(bundle.site.slug, action.href)} label={action.label} src={smartToolUrl(bundle, action.tool)} className="micks-hero-button" />
          : <Link key={action.label} href={localSiteHref(bundle.site.slug, action.href)} className="micks-hero-button"><span>{action.label}</span></Link>)}</div>
        <div className="micks-contact-strips">
          {address && <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`} className="micks-contact-strip"><PinIcon className="h-4 w-4" /><span>{address}</span></a>}
          {settings?.phone && <a href={telHref(settings.phone)} className="micks-contact-strip"><PhoneIcon className="h-4 w-4" /><span>{settings.phone}</span></a>}
        </div>
      </div>
    </section>;
  }
  return (
    <section className="micks-inner-hero" style={background ? { backgroundImage: `linear-gradient(rgba(0,0,0,.7),rgba(0,0,0,.7)),url(${JSON.stringify(background)})` } : undefined}>
      <div className="container-site micks-inner-hero-content">
        <h1>{heading}</h1>
        <div className="micks-inner-actions">
          <Link href={localSiteHref(bundle.site.slug, schedule.href)} className="micks-inner-action micks-inner-action-primary"><span>{schedule.label}</span></Link>
          {address && <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`} className="micks-inner-action"><span><PinIcon className="h-4 w-4" />{address}</span></a>}
          {settings?.phone && <a href={telHref(settings.phone)} className="micks-inner-action"><span><PhoneIcon className="h-4 w-4" />{settings.phone}</span></a>}
          <ToolPopupLink
            href={localSiteHref(bundle.site.slug, globalCta(design, "/diagnostics/", "Start diagnostics").href)}
            label="Free AI-Powered Pre-Diagnosis"
            src={smartToolUrl(bundle, "diagnostics")}
            className="micks-inner-action micks-inner-diagnostic"
          >
            <span><strong>Not sure what&apos;s wrong?</strong><small>Free AI-Powered<br />Pre-Diagnosis</small></span>
          </ToolPopupLink>
        </div>
      </div>
    </section>
  );
}
