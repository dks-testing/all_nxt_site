/* eslint-disable @next/next/no-img-element */
/** Shared site logo and name for the websites list, dashboard and editing header. */
export function resolveSiteLogo(logoUrl: string | null | undefined): string | null {
  if (!logoUrl) return null;
  if (/^https:\/\/[^\s]+$/i.test(logoUrl) || /^http:\/\/localhost(?::\d+)?\//i.test(logoUrl)) return logoUrl;
  if (logoUrl.startsWith("/") && !logoUrl.startsWith("//")) {
    const origin = (process.env.SITES_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    return `${origin}${logoUrl}`;
  }
  return null;
}

export function SiteIdentity({ name, slug, logoUrl, compact = false }: { name: string; slug?: string; logoUrl?: string | null; compact?: boolean }) {
  const src = resolveSiteLogo(logoUrl);
  return (
    <span className="inline-flex max-w-full items-center gap-3 align-middle">
      <span className={`${compact ? "h-10 w-12" : "h-12 w-14"} inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-sm`}>
        {src ? <img src={src} alt={`${name} logo`} className="h-full w-full object-contain" loading="lazy" /> : <span aria-hidden="true" className="text-lg font-semibold text-indigo-600">{name.trim().charAt(0).toUpperCase() || "S"}</span>}
      </span>
      <span className="min-w-0 text-left">
        <span className="block break-words font-semibold text-slate-900">{name}</span>
        {slug && <span className="mt-0.5 block text-xs font-normal text-slate-500">{slug}</span>}
      </span>
    </span>
  );
}
