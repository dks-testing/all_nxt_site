import { getDb, menus, pages, themes, eq, asc } from "@platform/db";
import { getDesign } from "@platform/db/theme";
import { loadSite } from "@/lib/site";
import { saveMenus } from "@/lib/actions/content";
import { PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/ConfirmButton";
import { MenuEditor } from "@/components/MenuEditor";

export default async function NavigationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await loadSite(id, "EDITOR");
  const db = getDb();
  const [rows, sitePages, [theme]] = await Promise.all([
    db.select().from(menus).where(eq(menus.siteId, id)),
    db.select({ slug: pages.slug, title: pages.title }).from(pages).where(eq(pages.siteId, id)).orderBy(asc(pages.sortOrder)),
    db.select({ design: themes.design }).from(themes).where(eq(themes.siteId, id)).limit(1),
  ]);
  const header = rows.find((r) => r.location === "header")?.items;
  const footer = rows.find((r) => r.location === "footer")?.items;
  const design = getDesign(theme ?? {});
  const redlineHidden = new Set(design.footerRedlineHiddenPages ?? []);
  const logosHidden = new Set(design.footerLogosHiddenPages ?? []);
  return (
    <>
      <PageHeader title="Header & footer" description="Build the public navigation with structured links, dropdowns and optional badges." />
      <form action={saveMenus} className="space-y-6">
        <input type="hidden" name="siteId" value={id} />
        <MenuEditor name="headerJson" title="Header navigation" description="Main navigation and service dropdowns shown at the top of every page." initial={header ?? []} allowChildren />
        <MenuEditor name="footerJson" title="Footer navigation" description="Quick links displayed in the shared footer on every page." initial={footer ?? []} />
        <section className="card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6"><h2 className="font-semibold text-slate-950">Footer brand-row visibility</h2><p className="mt-1 text-sm text-slate-500">Choose where the red divider and logo/certification row appear. The landing page always displays both.</p></div>
          <div className="overflow-x-auto p-5 sm:p-6">
            <table className="table min-w-[620px]">
              <thead><tr><th>Page</th><th>Red divider</th><th>Logo &amp; certifications</th></tr></thead>
              <tbody>{sitePages.map((page) => {
                const landing = page.slug === "";
                return <tr key={page.slug || "home"}><td><strong className="text-slate-800">{page.title}</strong><span className="ml-2 text-xs text-slate-400">{landing ? "Landing page" : `/${page.slug}/`}</span></td><td><label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="footerRedlineVisible" value={page.slug} defaultChecked={landing || !redlineHidden.has(page.slug)} disabled={landing} className="h-4 w-4 accent-indigo-600" />Show</label></td><td><label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="footerLogosVisible" value={page.slug} defaultChecked={landing || !logosHidden.has(page.slug)} disabled={landing} className="h-4 w-4 accent-indigo-600" />Show</label></td></tr>;
              })}</tbody>
            </table>
          </div>
        </section>
        <div className="sticky bottom-4 z-20 flex justify-end rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-xl shadow-slate-900/10 backdrop-blur-xl"><SubmitButton>Save header & footer</SubmitButton></div>
      </form>
    </>
  );
}
