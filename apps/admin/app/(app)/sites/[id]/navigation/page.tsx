import { getDb, menus, eq } from "@platform/db";
import { loadSite } from "@/lib/site";
import { saveMenus } from "@/lib/actions/content";
import { PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/ConfirmButton";
import { MenuEditor } from "@/components/MenuEditor";

export default async function NavigationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await loadSite(id, "EDITOR");
  const rows = await getDb().select().from(menus).where(eq(menus.siteId, id));
  const header = rows.find((r) => r.location === "header")?.items;
  const footer = rows.find((r) => r.location === "footer")?.items;
  return (
    <>
      <PageHeader title="Header & footer" description="Build the public navigation with structured links, dropdowns and optional badges." />
      <form action={saveMenus} className="grid gap-6 lg:grid-cols-2">
        <input type="hidden" name="siteId" value={id} />
        <MenuEditor name="headerJson" title="Header menu" description="Main navigation and service dropdowns." initial={header ?? []} allowChildren />
        <MenuEditor name="footerJson" title="Footer quick links" description="Links displayed in the shared footer." initial={footer ?? []} />
        <div className="lg:col-span-2"><SubmitButton>Save header & footer</SubmitButton></div>
      </form>
    </>
  );
}
