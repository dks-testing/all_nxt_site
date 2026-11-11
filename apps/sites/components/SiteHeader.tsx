import Link from "next/link";
import type { SiteBundle, MenuItem } from "@platform/db";
import { telHref } from "@/lib/format";
import { PhoneIcon, MenuIcon, ChevronIcon } from "./Icons";
import { getDesign } from "@platform/db/theme";
import { localSiteHref } from "@/lib/url";

export function SiteHeader({ bundle, topBar }: { bundle: SiteBundle; topBar?: { heading: string; ctaLabel: string | null; ctaUrl: string | null } | null }) {
  const { settings, theme, headerMenu } = bundle;
  const name = settings?.businessName ?? bundle.site.name;
  const design = getDesign(theme ?? {});
  if (design.headerStyle === "angled" || (!theme?.design && bundle.site.slug === "micks-repair")) {
    return <AngledHeader bundle={bundle} />;
  }
  return (
    <header className="sticky top-0 z-40 bg-white/95 shadow-sm backdrop-blur">
      {topBar && (
        <div className="bg-[var(--color-secondary)] px-4 py-2 text-center text-sm text-white">
          {topBar.heading}
          {topBar.ctaUrl && (
            <Link href={localSiteHref(bundle.site.slug, topBar.ctaUrl)} className="ml-2 font-semibold underline">
              {topBar.ctaLabel ?? "Learn more"}
            </Link>
          )}
        </div>
      )}
      <div className="container-site flex h-20 items-center justify-between gap-6">
        <Link href={localSiteHref(bundle.site.slug, "/")} className="flex shrink-0 items-center gap-3" aria-label={`${name} home`}>
          {theme?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={theme.logoUrl} alt={name} className="h-12 w-auto max-w-[200px] object-contain" />
          ) : (
            <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)]">{name}</span>
          )}
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main">
          {headerMenu.map((item) => (
            <NavItem key={item.href + item.label} item={item} slug={bundle.site.slug} />
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {settings?.phone && (
            <a href={telHref(settings.phone)} className="btn btn-primary hidden whitespace-nowrap !px-4 !py-2.5 sm:inline-flex">
              <PhoneIcon className="h-4 w-4" /> {settings.phone}
            </a>
          )}
          <details className="relative xl:hidden">
            <summary className="rounded-md p-2 text-[var(--color-secondary)]" aria-label="Open menu">
              <MenuIcon />
            </summary>
            <div className="absolute right-0 top-12 w-72 rounded-site border border-gray-200 bg-white p-3 shadow-xl">
              {headerMenu.map((item) => (
                <div key={item.href + item.label}>
                  <Link href={localSiteHref(bundle.site.slug, item.href)} className="block rounded px-3 py-2 font-semibold hover:bg-[var(--color-surface)]">{item.label}</Link>
                  {item.children?.map((c) => (
                    <Link key={c.href} href={localSiteHref(bundle.site.slug, c.href)} className="block rounded px-6 py-1.5 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface)]">{c.label}</Link>
                  ))}
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

function NavItem({ item, slug }: { item: MenuItem; slug: string }) {
  const cls = "flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-secondary)] hover:text-[var(--color-primary)]";
  if (!item.children?.length) return <Link href={localSiteHref(slug, item.href)} className={cls}>{item.label}{item.badge && <span className="site-badge ml-1 rounded px-1.5 py-0.5 text-[10px]">{item.badge}</span>}</Link>;
  return (
    <div className="nav-dd">
      <Link href={localSiteHref(slug, item.href)} className={cls}>
        {item.label} {item.badge && <span className="site-badge px-1.5 py-0.5 text-[10px]">{item.badge}</span>} <ChevronIcon className="h-3.5 w-3.5" />
      </Link>
      <div className="nav-dd-menu absolute left-0 top-full min-w-64 rounded-site border border-gray-100 bg-white p-2 shadow-xl">
        {item.children.map((c) => (
          <Link key={c.href} href={localSiteHref(slug, c.href)} className="block rounded px-3 py-2 text-sm hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]">{c.label}</Link>
        ))}
      </div>
    </div>
  );
}

function AngledHeader({ bundle }: { bundle: SiteBundle }) {
  const { settings, theme, headerMenu } = bundle;
  const name = settings?.businessName ?? bundle.site.name;
  const links = headerMenu.filter((item) => item.href !== "/" || !/^home$/i.test(item.label));
  const weekday = settings?.hours?.find((h) => h.day === "Mon" && !h.closed);
  const compactTime = (time: string) => {
    const [hh, mm] = time.split(":").map(Number);
    return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, "0")}`;
  };
  const hours = weekday?.open && weekday.close ? `M-F ${compactTime(weekday.open)}-${compactTime(weekday.close)}` : "Call for hours";
  return (
    <header className="micks-header-outer sticky top-0 z-40">
      <div className="micks-header-shape">
        <Link href={localSiteHref(bundle.site.slug, "/")} className="micks-logo" aria-label={`${name} home`}>
          {theme?.logoUrl ? <img src={theme.logoUrl} alt={name} className="h-full w-full object-contain" /> :
            <span className="font-[family-name:var(--font-heading)] text-3xl font-black italic text-black">{name}</span>}
        </Link>
        <nav className="micks-primary-nav" aria-label="Main navigation">
          {links.map((item) => <div key={item.label + item.href} className="micks-nav-entry">
            <Link href={localSiteHref(bundle.site.slug, item.href)} className="micks-nav-link">{item.label}{item.children?.length ? <ChevronIcon className="h-4 w-4" /> : null}{item.badge && <span className="site-badge rounded px-1 text-[10px]">{item.badge}</span>}</Link>
            {item.children?.length ? <div className="micks-dropdown">{item.children.map((child) => <Link key={child.href} href={localSiteHref(bundle.site.slug, child.href)} className="block px-3 py-2 text-sm hover:bg-slate-100">{child.label}{child.badge && <span className="site-badge ml-2 rounded px-1 text-[10px]">{child.badge}</span>}</Link>)}</div> : null}
          </div>)}
        </nav>
        {settings?.phone && <a href={telHref(settings.phone)} className="micks-phone-panel" aria-label={`Call ${settings.phone}`}>
          <strong>{settings.phone}</strong><span>{hours}</span>
        </a>}
        <details className="micks-mobile-menu">
          <summary className="p-3" aria-label="Open menu"><MenuIcon /></summary>
          <nav aria-label="Mobile navigation" className="micks-mobile-menu-list">
            {links.map((item) => <div key={item.href + item.label}>
              <Link href={localSiteHref(bundle.site.slug, item.href)} className="block px-4 py-2 font-semibold">{item.label}</Link>
              {item.children?.map((child) => <Link href={localSiteHref(bundle.site.slug, child.href)} key={child.href} className="block px-7 py-1.5 text-sm">{child.label}</Link>)}
            </div>)}
          </nav>
        </details>
      </div>
    </header>
  );
}
