import { eq, getDb, integrations, siteSettings, themes } from "@platform/db";
import { getDesign } from "@platform/db/theme";
import { loadSite } from "@/lib/site";
import { saveGlobalSettings } from "@/lib/actions/content";
import { Card, Checkbox, Input, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/ConfirmButton";

export default async function GlobalSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { site } = await loadSite(id, "EDITOR");
  const db = getDb();
  const [[settings], [theme], tools] = await Promise.all([
    db.select().from(siteSettings).where(eq(siteSettings.siteId, id)),
    db.select().from(themes).where(eq(themes.siteId, id)),
    db.select().from(integrations).where(eq(integrations.siteId, id)),
  ]);
  const design = getDesign(theme ?? {});
  const tireTool = tools.find((row) => row.type === "tire_finder");
  const diagnosticTool = tools.find((row) => row.type === "ai_diagnostic");
  const tool = tireTool?.config?.url ? tireTool : diagnosticTool;

  return (
    <>
      <PageHeader title="Global settings" description="Change a value once and every matching use across this website updates automatically." />
      <form action={saveGlobalSettings} className="space-y-6">
        <input type="hidden" name="siteId" value={id} />
        <Card title="Global name placeholders" description="Manage the full business name and the short owner or brand name from one place.">
          <div className="grid gap-4 lg:grid-cols-2">
            <Input label="Business name" name="businessName" defaultValue={settings?.businessName ?? site.name} required help="Replaces {{businessName}}, {{shopName}}, and every full Mick’s Repair reference." />
            <Input label="Owner / short name" name="ownerName" defaultValue={settings?.ownerName ?? "Mick’s"} required help="Replaces {{ownerName}} and standalone Mick’s references without changing the full business name." />
          </div>
          <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-6 text-indigo-900">
            Use <code className="rounded bg-white px-1.5 py-0.5 font-mono">{"{{businessName}}"}</code> for the complete shop name and <code className="rounded bg-white px-1.5 py-0.5 font-mono">{"{{ownerName}}"}</code> for the short name. Legacy “Mick’s Repair” and standalone “Mick’s” copy is replaced automatically.
          </div>
        </Card>

        <Card title="Global button destinations" description="All buttons recognized as the same action use these links, including heroes, service pages, callouts and content blocks.">
          <div className="grid gap-4 lg:grid-cols-3">
            <Input label="Schedule service link" name="scheduleCtaHref" defaultValue={design.scheduleCtaHref ?? "/make-an-appointment/"} required />
            <Input label="Diagnostics link" name="diagnosticsCtaHref" defaultValue={design.diagnosticsCtaHref ?? "/diagnostics/"} required />
            <Input label="Tire finder link" name="tiresCtaHref" defaultValue={design.tiresCtaHref ?? "/tires/"} required />
          </div>
        </Card>

        <Card title="Shared tire and AI tool" description="One embed URL powers both the Tires and Diagnostics integrations.">
          <div className="space-y-4">
            <Input label="Shared embed URL" name="toolEmbedUrl" type="url" defaultValue={tool?.config?.url ?? ""} placeholder="https://…" help="Paste the embeddable tool URL, not a full iframe tag." />
            <Checkbox label="Enable the shared tool" name="toolEnabled" defaultChecked={Boolean(tireTool?.enabled || diagnosticTool?.enabled)} />
          </div>
        </Card>

        <div className="sticky bottom-4 flex justify-end rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur">
          <SubmitButton>Save global settings</SubmitButton>
        </div>
      </form>
    </>
  );
}
