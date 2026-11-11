import type { Metadata } from "next";
import Script from "next/script";
import { themeToCss, googleFontsHref } from "@platform/db/theme";
import { getBundle, getTopBar, parseSiteParam } from "@/lib/data";
import { siteOrigin } from "@/lib/url";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LocalBusinessJsonLd } from "@/components/JsonLd";

type Params = { params: Promise<{ site: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const ctx = parseSiteParam((await params).site);
  const b = await getBundle(ctx);
  const name = b.settings?.businessName ?? b.site.name;
  return {
    metadataBase: new URL(siteOrigin(b)),
    title: { default: name, template: `%s | ${name}` },
    description: b.settings?.tagline ?? undefined,
    icons: b.theme?.faviconUrl ? { icon: b.theme.faviconUrl, apple: b.theme.faviconUrl } : undefined,
    openGraph: { siteName: name, type: "website", images: b.theme?.logoUrl ? [b.theme.logoUrl] : undefined },
    twitter: { card: "summary_large_image", title: name, description: b.settings?.tagline ?? undefined, images: b.theme?.logoUrl ? [b.theme.logoUrl] : undefined },
    robots: ctx.preview ? { index: false, follow: false } : undefined,
  };
}

export default async function SiteLayout({ children, params }: Params & { children: React.ReactNode }) {
  const ctx = parseSiteParam((await params).site);
  const bundle = await getBundle(ctx);
  const topBar = await getTopBar(ctx);
  const ga4 = bundle.integrations.ga4?.measurementId;
  const gtm = bundle.integrations.gtm?.containerId;
  const safeId = (v?: string) => (v && /^[A-Z0-9-]+$/i.test(v) ? v : undefined);

  return (
    <>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={googleFontsHref(bundle.theme?.fonts)} precedence="default" />
      <style href={`theme-${bundle.site.id}`} precedence="high">
        {themeToCss(bundle.theme ?? {}) + (bundle.theme?.customCss ? `\n${bundle.theme.customCss.replace(/<\/?style/gi, "")}` : "")}
      </style>
      {ctx.preview && (
        <div className="sticky top-0 z-50 bg-amber-400 px-4 py-1.5 text-center text-sm font-semibold text-black">
          Draft preview: {bundle.site.status === "PUBLISHED" ? "showing latest saved content" : `site is ${bundle.site.status.toLowerCase()}`}. Not visible to the public.
        </div>
      )}
      <SiteHeader bundle={bundle} topBar={topBar} />
      <main>{children}</main>
      <SiteFooter bundle={bundle} />
      <LocalBusinessJsonLd bundle={bundle} url={siteOrigin(bundle)} />
      {!ctx.preview && safeId(ga4) && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${safeId(ga4)}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${safeId(ga4)}');`}</Script>
        </>
      )}
      {!ctx.preview && safeId(gtm) && (
        <Script id="gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${safeId(gtm)}');`}</Script>
      )}
    </>
  );
}
