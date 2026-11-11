import { getDb, themes, siteSettings, media, eq, desc } from "@platform/db";
import { defaultColors, defaultFonts } from "@platform/db/theme";
import { loadSite } from "@/lib/site";
import { saveTheme } from "@/lib/actions/content";
import { PageHeader } from "@/components/ui";
import { ThemeEditor } from "@/components/ThemeEditor";

export default async function BrandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { site } = await loadSite(id, "EDITOR");
  const [t] = await getDb().select().from(themes).where(eq(themes.siteId, id));
  const [s] = await getDb().select({ name: siteSettings.businessName }).from(siteSettings).where(eq(siteSettings.siteId, id));
  const assets = await getDb().select({ id: media.id, url: media.url, alt: media.alt, width: media.width, height: media.height }).from(media).where(eq(media.siteId, id)).orderBy(desc(media.createdAt));
  const publicOrigin = (process.env.SITES_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return (
    <>
      <PageHeader title="Branding" description="Logo, colours and fonts. Changes apply to every page of this site." />
      <ThemeEditor
        siteId={id}
        businessName={s?.name ?? site.name}
        action={saveTheme}
        media={assets}
        publicOrigin={publicOrigin}
        initial={{
          colors: { ...defaultColors, ...(t?.colors ?? {}) },
          fonts: { ...defaultFonts, ...(t?.fonts ?? {}) },
          logoUrl: t?.logoUrl ?? "",
          logoDarkUrl: t?.logoDarkUrl ?? "",
          faviconUrl: t?.faviconUrl ?? "",
          radius: t?.radius ?? "0.75rem",
          buttonStyle: t?.buttonStyle ?? "rounded",
          customCss: t?.customCss ?? "",
          design: t?.design ?? {
            headerStyle: site.slug === "micks-repair" ? "angled" : "standard",
            buttonBackground: t?.colors?.primary ?? defaultColors.primary,
            buttonText: t?.colors?.primaryForeground ?? defaultColors.primaryForeground,
            buttonHoverBackground: t?.colors?.primary ?? defaultColors.primary,
            buttonHoverText: t?.colors?.primaryForeground ?? defaultColors.primaryForeground,
            badgeBackground: t?.colors?.accent ?? defaultColors.accent,
            badgeText: "#ffffff", buttonSkew: site.slug === "micks-repair" ? -14 : 0, buttonHoverTranslateY: -2,
          },
        }}
      />
    </>
  );
}
