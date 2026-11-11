import { getDb, integrations, eq } from "@platform/db";
import { loadSite } from "@/lib/site";
import { saveIntegrations } from "@/lib/actions/content";
import { PageHeader, Card, Input, Checkbox } from "@/components/ui";
import { SubmitButton } from "@/components/ConfirmButton";

export default async function IntegrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await loadSite(id, "EDITOR");
  const rows = await getDb().select().from(integrations).where(eq(integrations.siteId, id));
  const get = (t: string) => rows.find((r) => r.type === t);
  const cfg = (t: string, k: string) => get(t)?.config?.[k] ?? "";
  const on = (t: string) => get(t)?.enabled ?? false;
  const block = (type: string, title: string, desc: string, fields: [string, string, string?][]) => (
    <Card title={title} description={desc}>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([k, label, ph]) => <Input key={k} label={label} name={`${type}_${k}`} defaultValue={cfg(type, k)} placeholder={ph} />)}
        <div className="sm:col-span-2"><Checkbox label="Enabled" name={`${type}_enabled`} defaultChecked={on(type)} /></div>
      </div>
    </Card>
  );
  return (
    <>
      <PageHeader title="Integrations" description="Analytics and third-party tools for this site. The shared tire and diagnostics embed is managed in Global settings." />
      <form action={saveIntegrations} className="space-y-6">
        <input type="hidden" name="siteId" value={id} />
        <div className="grid gap-6 xl:grid-cols-2">
          {block("ga4", "Google Analytics 4", "Adds the gtag.js snippet on every page.", [["measurementId", "Measurement ID", "G-XXXXXXX"]])}
          {block("gtm", "Google Tag Manager", "Use instead of GA4 if you manage tags in GTM.", [["containerId", "Container ID", "GTM-XXXXXX"]])}
          {block("meta_pixel", "Meta Pixel", "Stored for the next release (not yet injected).", [["pixelId", "Pixel ID"]])}
          {block("chat", "Chat widget", "Stored for the next release (not yet injected).", [["url", "Script / widget URL"]])}
        </div>
        <SubmitButton>Save integrations</SubmitButton>
      </form>
    </>
  );
}
