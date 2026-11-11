import Link from "next/link";
import type { SiteBundle } from "@platform/db";
import { telHref, formatAddress, groupHours } from "@/lib/format";
import { PhoneIcon, PinIcon, ClockIcon } from "./Icons";
import { localSiteHref } from "@/lib/url";
import { getDesign } from "@platform/db/theme";
import { Stars } from "./Icons";
import { CertificationBadges } from "./CertificationBadge";

export function SiteFooter({ bundle }: { bundle: SiteBundle }) {
  const { settings, footerMenu, theme } = bundle;
  const design = getDesign(theme ?? {});
  if (design.headerStyle === "angled" || (!theme?.design && bundle.site.slug === "micks-repair")) {
    return <MicksFooter bundle={bundle} />;
  }
  const name = settings?.businessName ?? bundle.site.name;
  const social = Object.entries(settings?.social ?? {}).filter(([, v]) => v);
  return (
    <>
      <footer className="bg-[var(--color-secondary)] pb-24 pt-14 text-white/85 sm:pb-10">
        <div className="container-site grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            {theme?.logoDarkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={theme.logoDarkUrl} alt={name} className="mb-4 h-12 w-auto" />
            ) : (
              <p className="mb-3 font-[family-name:var(--font-heading)] text-2xl font-bold text-white">{name}</p>
            )}
            {settings?.footerNote && <p className="text-sm leading-relaxed">{settings.footerNote}</p>}
            {social.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {social.map(([k, v]) => (
                  <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="capitalize underline-offset-4 hover:underline">{k}</a>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Contact</h3>
            {settings?.phone && (
              <a href={telHref(settings.phone)} className="mb-2 flex items-center gap-2 hover:text-white"><PhoneIcon className="h-4 w-4" />{settings.phone}</a>
            )}
            {settings?.address && (
              <p className="flex gap-2 text-sm"><PinIcon className="mt-0.5 h-4 w-4 shrink-0" /><span className="whitespace-pre-line">{formatAddress(settings.address, false)}</span></p>
            )}
            {settings?.email && <a href={`mailto:${settings.email}`} className="mt-2 block text-sm hover:text-white">{settings.email}</a>}
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Hours</h3>
            <ul className="space-y-1 text-sm">
              {groupHours(settings?.hours).map((h) => (
                <li key={h.days} className="flex gap-2"><ClockIcon className="mt-0.5 h-4 w-4 shrink-0" /><span className="w-20 font-semibold">{h.days}</span><span>{h.time}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Quick links</h3>
            <ul className="space-y-1.5 text-sm">
              {footerMenu.map((m) => (
                <li key={m.href}><Link href={localSiteHref(bundle.site.slug, m.href)} className="hover:text-white">{m.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="container-site mt-10 border-t border-white/15 pt-6 text-xs text-white/60">
          © {new Date().getFullYear()} {name}. All rights reserved.
        </div>
      </footer>
      {settings?.phone && (
        <a href={telHref(settings.phone)} className="btn btn-primary fixed inset-x-3 bottom-3 z-50 shadow-2xl sm:hidden">
          <PhoneIcon className="h-5 w-5" /> Call {settings.phone}
        </a>
      )}
    </>
  );
}

function MicksFooter({ bundle }: { bundle: SiteBundle }) {
  const { settings, theme, footerMenu } = bundle;
  const design = getDesign(theme ?? {});
  const name = settings?.businessName ?? bundle.site.name;
  const address = formatAddress(settings?.address);
  const email = settings?.email || "info@micksrepair.com";
  const googleUrl = settings?.social?.google;
  const facebookUrl = settings?.social?.facebook;
  const footerBackground = design.footerBackgroundImageUrl || "https://www.micksrepair.com/wp-content/uploads/2026/03/Micks-Repair-Worthington-MN-1-of-4.jpeg";
  const legalLinks = footerMenu.filter((item) => /faq|terms|privacy/i.test(item.label));
  const footerLinks = legalLinks.length ? legalLinks : footerMenu;
  return <>
    <footer className="micks-site-footer">
      <div className="micks-footer-redline" />
      <div className="micks-footer-logos container-site">
        {theme?.logoUrl ? <img src={theme.logoUrl} alt={name} className="micks-footer-main-logo" /> : <strong>{name}</strong>}
        <CertificationBadges design={design} className="micks-footer-certifications" />
      </div>
      <div className="micks-footer-main" style={{ backgroundImage: `linear-gradient(#0b0b0bd9,#0b0b0bd9),url(${JSON.stringify(footerBackground)})` }}>
        <div className="container-site micks-footer-main-grid">
          <div>
            <h2>Contact</h2>
            <p>{settings?.phone && <>Call us: <a href={telHref(settings.phone)}>{settings.phone}</a><br /></>}Mail us: <a href={`mailto:${email}`}>{email}</a><br />{address && <>Address: {address}</>}</p>
            <p>{groupHours(settings?.hours).map((row) => <span key={row.days}>{row.days}: {row.time}<br /></span>)}</p>
            <nav>{footerLinks.map((item, index) => <span key={item.href}><Link href={localSiteHref(bundle.site.slug, item.href)}>{item.label}</Link>{index < footerLinks.length - 1 ? " | " : ""}</span>)}</nav>
          </div>
          <div className="micks-footer-trust">
            <h2>Trust</h2>
            <strong>{name}</strong>
            {settings?.ratingValue && <div><b>{settings.ratingValue}</b> <Stars value={Number(settings.ratingValue)} /></div>}
            {settings?.ratingCount && <p>Based on {settings.ratingCount} reviews</p>}
            {googleUrl && <a className="micks-footer-review-link" href={googleUrl} target="_blank" rel="noopener noreferrer">review us on Google</a>}
            <h3>“Trusted by drivers in Worthington”</h3>
          </div>
        </div>
      </div>
      <div className="micks-footer-bottom">
        <div className="container-site"><span>© {new Date().getFullYear()} {name}, Inc. All Rights Reserved.</span>{facebookUrl && <a href={facebookUrl} target="_blank" rel="noopener noreferrer">Follow us on Facebook <b>f</b></a>}</div>
      </div>
    </footer>
    {settings?.phone && <a href={telHref(settings.phone)} className="btn btn-primary fixed inset-x-3 bottom-3 z-50 shadow-2xl sm:hidden"><PhoneIcon className="h-5 w-5" /> Call {settings.phone}</a>}
  </>;
}
