"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SiteBundle } from "@platform/db";
import { telHref, formatAddress, groupHours } from "@/lib/format";
import { PhoneIcon, PinIcon, ClockIcon } from "./Icons";
import { localSiteHref } from "@/lib/url";
import { getDesign } from "@platform/db/theme";
import { Stars } from "./Icons";
import { CertificationBadge, getActiveCertificationBadges } from "./CertificationBadge";
import { globalText } from "@/lib/global-content";

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
            {settings?.footerNote && <p className="text-sm leading-relaxed">{globalText(settings.footerNote, bundle)}</p>}
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
                <li key={m.href}><Link href={localSiteHref(bundle.site.slug, m.href)} className="hover:text-white">{globalText(m.label, bundle)}</Link></li>
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
          <PhoneIcon className="h-5 w-5" /><span>Call {settings.phone}</span>
        </a>
      )}
    </>
  );
}

function MicksFooter({ bundle }: { bundle: SiteBundle }) {
  const pathname = usePathname();
  const { settings, theme, footerMenu } = bundle;
  const design = getDesign(theme ?? {});
  const parts = pathname.split("/").filter(Boolean).map((part) => {
    try { return decodeURIComponent(part); } catch { return part; }
  });
  const routeParts = parts[0] === bundle.site.slug ? parts.slice(1) : (["s", "p"].includes(parts[0]) ? parts.slice(2) : parts);
  const pageSlug = routeParts.join("/");
  const landingPage = pageSlug === "";
  const showRedline = landingPage || !(design.footerRedlineHiddenPages ?? []).includes(pageSlug);
  const showLogos = landingPage || !(design.footerLogosHiddenPages ?? []).includes(pageSlug);
  const name = settings?.businessName ?? bundle.site.name;
  const address = formatAddress(settings?.address);
  const email = settings?.email;
  const googleUrl = settings?.social?.google;
  const facebookUrl = settings?.social?.facebook;
  const footerBackground = design.footerBackgroundImageUrl || "https://www.micksrepair.com/wp-content/uploads/2026/03/Micks-Repair-Worthington-MN-1-of-4.jpeg";
  const legalLinks = footerMenu.filter((item) => /faq|terms|privacy/i.test(item.label));
  const footerLinks = legalLinks.length ? legalLinks : footerMenu;
  const poweredLink = design.footerPoweredLink;
  const poweredText = globalText(design.footerPoweredText || "Powered by Raise a Hood", bundle);
  const facebookText = globalText(design.footerFacebookText || "Follow us on Facebook", bundle);
  const footerBadges = getActiveCertificationBadges(design);
  return <>
    <footer className="micks-site-footer">
      {showRedline && <div className="micks-footer-redline" />}
      {showLogos && <div className="micks-footer-logo-band"><div className="micks-footer-logos container-site">
        <div className="micks-footer-badge-side">{footerBadges.slice(0, 1).map((badge) => <CertificationBadge key={badge.slot} design={design} slot={badge.slot} />)}</div>
        {theme?.logoUrl ? <img src={theme.logoUrl} alt={name} className="micks-footer-main-logo" /> : <strong>{name}</strong>}
        <div className="micks-footer-badge-side">{footerBadges.slice(1).map((badge) => <CertificationBadge key={badge.slot} design={design} slot={badge.slot} />)}</div>
      </div></div>}
      <div className="micks-footer-main" style={{ backgroundImage: `linear-gradient(#0b0b0bd9,#0b0b0bd9),url(${JSON.stringify(footerBackground)})` }}>
        <div className="container-site micks-footer-main-grid">
          <div>
            <h2>Contact</h2>
            <dl className="micks-footer-contact-list">
              {settings?.phone && <><dt>Call us:</dt><dd><a href={telHref(settings.phone)}>{settings.phone}</a></dd></>}
              {email && <><dt>Mail us:</dt><dd><a href={`mailto:${email}`}>{email}</a></dd></>}
              {address && <><dt>Address:</dt><dd>{address}</dd></>}
            </dl>
            <p>{groupHours(settings?.hours).map((row) => <span key={row.days}>{row.days}: {row.time}<br /></span>)}</p>
            <nav>{footerLinks.map((item, index) => <span key={item.href}><Link href={localSiteHref(bundle.site.slug, item.href)}>{globalText(item.label, bundle)}</Link>{index < footerLinks.length - 1 ? " | " : ""}</span>)}</nav>
          </div>
          <div className="micks-footer-trust">
            <h2>Trust</h2>
            <div className="micks-footer-rating">
              <img className="micks-footer-rating-avatar" src={footerBackground} alt="" />
              <div className="micks-footer-rating-details">
                <strong>{name}</strong>
                {settings?.ratingValue && <div className="micks-footer-rating-stars"><b>{settings.ratingValue}</b><Stars value={Number(settings.ratingValue)} /></div>}
                {settings?.ratingCount && <p>Based on {settings.ratingCount} reviews</p>}
                {googleUrl && <a className="micks-footer-review-link" href={googleUrl} target="_blank" rel="noopener noreferrer">review us on <span className="micks-footer-google-mark" aria-label="Google">G</span></a>}
              </div>
            </div>
            <h3>{`“Trusted by drivers in ${settings?.address?.city || "Worthington"}”`}</h3>
          </div>
        </div>
      </div>
      <div className="micks-footer-bottom">
        <div className="container-site">
          <span>© {new Date().getFullYear()} {name}, Inc. All Rights Reserved.</span>
          {(poweredLink || design.footerPoweredLogoUrl) && <a className="micks-footer-powered" href={poweredLink || "#"} target={poweredLink ? "_blank" : undefined} rel={poweredLink ? "noopener noreferrer" : undefined} aria-label={poweredText}>
            {design.footerPoweredLogoUrl ? <><span>Powered by</span><img src={design.footerPoweredLogoUrl} alt={poweredText} /></> : poweredText}
          </a>}
          {facebookUrl && <a className="micks-footer-facebook" href={facebookUrl} target="_blank" rel="noopener noreferrer">{facebookText && <span>{facebookText}</span>}<b aria-hidden="true">f</b></a>}
        </div>
      </div>
    </footer>
    {settings?.phone && <a href={telHref(settings.phone)} className="btn btn-primary fixed inset-x-3 bottom-3 z-50 shadow-2xl sm:hidden"><PhoneIcon className="h-5 w-5" /><span>Call {settings.phone}</span></a>}
  </>;
}
