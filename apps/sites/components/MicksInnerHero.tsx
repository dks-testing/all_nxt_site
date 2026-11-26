import Link from "next/link";
import type { SiteBundle } from "@platform/db";
import { getDesign, isGlobalButtonEnabled } from "@platform/db/theme";
import { formatAddress, telHref, TextWithBreaks } from "@/lib/format";
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
  const innerAddress = [settings?.address?.street, settings?.address?.city].filter(Boolean).join(", ");
  const scheduleSource = primaryCta ?? { label: "Schedule Service", href: "/make-an-appointment/#book" };
  const schedule = globalCta(design, scheduleSource.href, scheduleSource.label);
  if (variant === "page") {
    const actions = [
      { key: "schedule", action: globalCta(design, undefined, undefined, "schedule") },
      { key: "diagnostics", action: globalCta(design, undefined, undefined, "diagnostics") },
      { key: "tires", action: globalCta(design, undefined, undefined, "tires") },
    ] as const;
    const visibleActions = actions.flatMap(({ key, action }) => action ? [{ key, ...action }] : []);
    return <section className="micks-inner-hero micks-shared-banner" style={background ? { backgroundImage: `linear-gradient(rgba(0,0,0,.68),rgba(0,0,0,.68)),url(${JSON.stringify(background)})` } : undefined}>
      <div className="container-site micks-inner-hero-content">
        <h1><TextWithBreaks text={heading} /></h1>
        {visibleActions.length > 0 && <div className="micks-shared-banner-actions">{visibleActions.map((action) => action.key !== "schedule"
          ? <ToolPopupLink key={action.key} href={localSiteHref(bundle.site.slug, action.href)} label={action.label} src={smartToolUrl(bundle, action.key)} className="micks-hero-button" />
          : <Link key={action.key} href={localSiteHref(bundle.site.slug, action.href)} className="micks-hero-button"><span>{action.label}</span></Link>)}</div>}
        <div className="micks-contact-strips">
          {innerAddress && <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`} className="micks-contact-strip"><PinIcon className="h-4 w-4" /><span>{innerAddress}</span></a>}
          {settings?.phone && isGlobalButtonEnabled(design, "call") && <a href={telHref(settings.phone)} className="micks-contact-strip"><PhoneIcon className="h-4 w-4" /><span>{settings.phone}</span></a>}
        </div>
      </div>
    </section>;
  }
  const diagnostics = globalCta(design, undefined, undefined, "diagnostics");
  const showCall = settings?.phone && isGlobalButtonEnabled(design, "call");
  return (
    <section className="micks-inner-hero" style={background ? { backgroundImage: `linear-gradient(rgba(0,0,0,.7),rgba(0,0,0,.7)),url(${JSON.stringify(background)})` } : undefined}>
      <div className="container-site micks-inner-hero-content">
        <h1><TextWithBreaks text={heading} /></h1>
        {(schedule || innerAddress || showCall || diagnostics) && <div className="micks-inner-actions">
          {schedule && <Link href={localSiteHref(bundle.site.slug, schedule.href)} className="micks-inner-action micks-inner-action-primary"><span>{schedule.label}</span></Link>}
          {innerAddress && <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`} className="micks-inner-action"><span><PinIcon className="h-4 w-4" />{innerAddress}</span></a>}
          {showCall && <a href={telHref(settings.phone)} className="micks-inner-action"><span><PhoneIcon className="h-4 w-4" />{settings.phone}</span></a>}
          {diagnostics && <ToolPopupLink
            href={localSiteHref(bundle.site.slug, diagnostics.href)}
            label="Free AI-Powered Pre-Diagnosis"
            src={smartToolUrl(bundle, "diagnostics")}
            className="micks-inner-action micks-inner-diagnostic"
          >
            <span><strong>Not sure what&apos;s wrong?</strong><small>Free AI-Powered<br />Pre-Diagnosis</small></span>
          </ToolPopupLink>}
        </div>}
      </div>
    </section>
  );
}
