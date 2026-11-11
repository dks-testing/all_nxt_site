import { loadSite } from "@/lib/site";
import { platformUrl } from "@/lib/site-url";
import { domainOp } from "@/lib/actions/content";
import { PageHeader, Card, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/ConfirmButton";

export default async function DomainsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { site, domains, role } = await loadSite(id, "EDITOR");
  const owner = role === "OWNER";
  const op = (domainId: string, o: string, label: string, cls = "btn btn-secondary btn-sm", confirm?: string) => (
    <form action={domainOp}>
      <input type="hidden" name="siteId" value={id} /><input type="hidden" name="domainId" value={domainId} /><input type="hidden" name="op" value={o} />
      <SubmitButton className={cls} confirm={confirm}>{label}</SubmitButton>
    </form>
  );
  return (
    <>
      <PageHeader title="Domains" description="Every site always works at its platform address. Add the shop's own domain when ready to go live." />
      <Card title="Platform address" className="mb-6">
        <a href={platformUrl(site.slug)} target="_blank" rel="noreferrer" className="font-mono text-sm text-[var(--color-brand)]">{platformUrl(site.slug)}</a>
      </Card>
      <Card title="Custom domains" className="mb-6">
        {domains.length === 0 ? <Empty>No custom domains yet.</Empty> : (
          <ul className="divide-y divide-slate-100">
            {domains.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="flex-1 font-mono text-sm">{d.hostname}</span>
                {d.isPrimary && <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">Primary</span>}
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${d.verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{d.verified ? `DNS verified · SSL ${d.sslStatus.toLowerCase()}` : "Waiting for DNS"}</span>
                {owner && !d.isPrimary && op(d.id, "primary", "Make primary")}
                {owner && !d.verified && op(d.id, "verify", "Verify DNS")}
                {owner && op(d.id, "remove", "Remove", "btn btn-danger btn-sm", `Remove ${d.hostname}? The site will stop answering on it.`)}
              </li>
            ))}
          </ul>
        )}
        {owner && (
          <form action={domainOp} className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
            <input type="hidden" name="siteId" value={id} /><input type="hidden" name="op" value="add" />
            <label><span className="label">Add domain</span><input name="hostname" placeholder="micksrepair.com" className="input w-72" required /></label>
            <SubmitButton>Add</SubmitButton>
          </form>
        )}
      </Card>
      <Card title="DNS instructions">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>At the domain registrar or Cloudflare, add an <strong>A record</strong> for the root domain pointing to <code>76.76.21.21</code> (Vercel), and a <strong>CNAME</strong> for <code>www</code> pointing to <code>cname.vercel-dns.com</code>.</li>
          <li>Add the same hostnames to the Vercel project for the sites app (or automate via the Vercel Domains API, see README).</li>
          <li>Configure <code>DOMAIN_EXPECTED_A</code> or <code>DOMAIN_EXPECTED_CNAME</code>, then select <em>Verify DNS</em>. This only checks that DNS matches your configured destination. Verify SSL separately in your hosting provider.</li>
          <li>Add both <code>example.com</code> and <code>www.example.com</code>; make the one you want in Google the primary.</li>
        </ol>
      </Card>
    </>
  );
}
