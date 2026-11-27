import { eq, getDb, integrations, siteSettings, themes } from "@platform/db";
import { getDesign, isGlobalButtonEnabled } from "@platform/db/theme";
import { loadSite } from "@/lib/site";
import { saveGlobalSettings } from "@/lib/actions/content";
import { Card, Checkbox, Input, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/ConfirmButton";
import { widgetButtonIdBases } from "@platform/db/widget-buttons";

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
  let inferredToolWidgetKey = "";
  try { inferredToolWidgetKey = new URL(tool?.config?.url ?? "").searchParams.get("id") ?? ""; } catch { /* Keep the field blank for non-URL legacy values. */ }
  const toolWidgetKey = tool?.config?.key || inferredToolWidgetKey;

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
          <input type="hidden" name="globalButtonVisibility" value="1" />
          <div className="space-y-4">
            {([
              ["schedule", "Schedule service", design.scheduleCtaLabel ?? "Schedule Service", design.scheduleCtaHref ?? "/make-an-appointment/"],
              ["diagnostics", "Diagnostics", design.diagnosticsCtaLabel ?? "Start Diagnostics", design.diagnosticsCtaHref ?? "/diagnostics/"],
              ["tires", "Tire finder", design.tiresCtaLabel ?? "Find the Right Tires", design.tiresCtaHref ?? "/tires/"],
              ["about", "About us", design.aboutCtaLabel ?? "About Us", design.aboutCtaHref ?? "/about-us/"],
              ["services", "Services", design.servicesCtaLabel ?? "View Services", design.servicesCtaHref ?? "/services/"],
              ["call", "Call", design.callCtaLabel ?? "Call Now", design.callCtaHref ?? (settings?.phone ? `tel:${settings.phone.replace(/[^+\d]/g, "")}` : "")],
            ] as const).map(([key, title, label, href]) => <div key={key} className="grid gap-3 rounded-xl border border-slate-200 p-4 lg:grid-cols-[150px_1fr_1.1fr_1.3fr] lg:items-end">
              <div className="space-y-2"><strong className="block text-sm">{title}</strong><Checkbox label={`Enable ${title.toLowerCase()}`} name={`globalButton:${key}:enabled`} defaultChecked={isGlobalButtonEnabled(design, key)} /></div>
              <Input label="Button label" name={`${key}CtaLabel`} defaultValue={label} required />
              <label className="block"><span className="label">Button widget ID</span><select name={`${key}CtaId`} className="input" defaultValue={design.globalButtonIds?.[key] ?? ""}><option value="">No widget ID</option>{widgetButtonIdBases.map((base) => <option key={base} value={base}>{base}</option>)}</select><span className="help">With a blank link, generates the selected ID + &quot;-{site.slug}-001&quot;, then 002 and onward.</span></label>
              <Input label="Button link" name={`${key}CtaHref`} defaultValue={href} help={key === "call" ? "A link overrides the widget ID. Leave both blank to use the Business info phone number." : "A link overrides the widget ID. Clear this field to use the selected widget ID."} />
            </div>)}
            <div className="grid gap-3 rounded-xl border border-slate-200 p-4 lg:grid-cols-[150px_1fr_1.3fr] lg:items-end">
              <div className="space-y-2"><strong className="block text-sm">Service cards</strong><Checkbox label="Enable service card buttons" name="globalButton:serviceCard:enabled" defaultChecked={isGlobalButtonEnabled(design, "serviceCard")} /></div>
              <Input label="Button label" name="serviceCardCtaLabel" defaultValue={design.serviceCardCtaLabel && !/^learn more$/i.test(design.serviceCardCtaLabel.trim()) ? design.serviceCardCtaLabel : "Read More"} required />
              <p className="pb-2 text-xs text-slate-500">Each card automatically links to its own service page, so only one shared label is needed.</p>
            </div>
          </div>
        </Card>

        <Card title="Shared tire and AI tool" description="One embed URL powers both the Tires and Diagnostics integrations.">
          <div className="space-y-4">
            <Input label="Shared embed URL" name="toolEmbedUrl" type="url" defaultValue={tool?.config?.url ?? ""} placeholder="https://…" help="Paste the Raise a Hood widget-loader.js URL or an embeddable page URL, not a full script or iframe tag." />
            <Input label="Shared widget key" name="toolWidgetKey" defaultValue={toolWidgetKey} placeholder="fe39b92a-c576-4939-b30f-b7df5cd19f46" help="For widget-loader.js?v=2.0 URLs, enter the data-key value. It is filled automatically when the URL contains ?id=." />
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
