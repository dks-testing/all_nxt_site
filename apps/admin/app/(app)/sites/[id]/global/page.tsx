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
  const businessName = settings?.businessName || site.name;
  const ownerName = settings?.ownerName || (/^Mick(?:'|’)?s Repair$/i.test(businessName) ? "Mick’s" : businessName);
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
            <Input label="Owner / short name" name="ownerName" defaultValue={ownerName} required help="Replaces {{ownerName}} and standalone Mick’s references without changing the full business name." />
          </div>
          <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-6 text-indigo-900">
            Use <code className="rounded bg-white px-1.5 py-0.5 font-mono">{"{{businessName}}"}</code> for the complete shop name and <code className="rounded bg-white px-1.5 py-0.5 font-mono">{"{{ownerName}}"}</code> for the short name. Legacy “Mick’s Repair” and standalone “Mick’s” copy is replaced automatically.
          </div>
        </Card>

        <Card title="Global website buttons" description="Edit each shared action once. Matching buttons in heroes, page sections, service pages, contact areas and mobile actions update together.">
          <div className="space-y-4">
            {[
              ["Schedule service", "scheduleCtaLabel", design.scheduleCtaLabel ?? "Schedule Service", "scheduleCtaHref", design.scheduleCtaHref ?? "/make-an-appointment/"],
              ["Diagnostics", "diagnosticsCtaLabel", design.diagnosticsCtaLabel ?? "Start Diagnostics", "diagnosticsCtaHref", design.diagnosticsCtaHref ?? "/diagnostics/"],
              ["Tire finder", "tiresCtaLabel", design.tiresCtaLabel ?? "Find the Right Tires", "tiresCtaHref", design.tiresCtaHref ?? "/tires/"],
              ["About us", "aboutCtaLabel", design.aboutCtaLabel ?? "About Us", "aboutCtaHref", design.aboutCtaHref ?? "/about-us/"],
              ["Services", "servicesCtaLabel", design.servicesCtaLabel ?? "View Services", "servicesCtaHref", design.servicesCtaHref ?? "/services/"],
              ["Call", "callCtaLabel", design.callCtaLabel ?? "Call Now", "callCtaHref", design.callCtaHref ?? (settings?.phone ? `tel:${settings.phone.replace(/[^+\d]/g, "")}` : "")],
            ].map(([title, labelName, labelValue, hrefName, hrefValue]) => <div key={String(labelName)} className="grid gap-3 rounded-xl border border-slate-200 p-4 lg:grid-cols-[150px_1fr_1.3fr] lg:items-end">
              <strong className="pb-2 text-sm">{title}</strong>
              <Input label="Button label" name={String(labelName)} defaultValue={String(labelValue)} required />
              <Input label="Button link" name={String(hrefName)} defaultValue={String(hrefValue)} required={title !== "Call"} help={title === "Call" ? "Leave blank to use the phone number from Business info." : undefined} />
            </div>)}
            <div className="grid gap-3 rounded-xl border border-slate-200 p-4 lg:grid-cols-[150px_1fr_1.3fr] lg:items-end">
              <strong className="pb-2 text-sm">Service cards</strong>
              <Input label="Button label" name="serviceCardCtaLabel" defaultValue={design.serviceCardCtaLabel ?? "Learn More"} required />
              <p className="pb-2 text-xs text-slate-500">Each card automatically links to its own service page, so only one shared label is needed.</p>
            </div>
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
