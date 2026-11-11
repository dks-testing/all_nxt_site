import { getDb, siteMembers, users, eq } from "@platform/db";
import { loadSite } from "@/lib/site";
import { memberOp } from "@/lib/actions/content";
import { PageHeader, Card, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/ConfirmButton";

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { role } = await loadSite(id, "VIEWER");
  const rows = await getDb().select({ id: siteMembers.id, role: siteMembers.role, email: users.email, name: users.name }).from(siteMembers).innerJoin(users, eq(users.id, siteMembers.userId)).where(eq(siteMembers.siteId, id));
  const owner = role === "OWNER";
  return (
    <>
      <PageHeader title="Team" description="Owners can publish and manage domains. Editors can change content. Viewers can only look." />
      <Card className="mb-6">
        {rows.length === 0 ? <Empty>No members yet. Super-admins always have access.</Empty> : (
          <ul className="divide-y divide-slate-100">
            {rows.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="flex-1"><strong>{m.name ?? m.email}</strong> <span className="text-slate-500">{m.email}</span></span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold">{m.role}</span>
                {owner && (
                  <form action={memberOp}><input type="hidden" name="siteId" value={id} /><input type="hidden" name="op" value="remove" /><input type="hidden" name="memberId" value={m.id} /><SubmitButton className="btn btn-danger btn-sm" confirm="Remove access?">Remove</SubmitButton></form>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      {owner && (
        <Card title="Give someone access">
          <form action={memberOp} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="siteId" value={id} /><input type="hidden" name="op" value="add" />
            <label><span className="label">User email</span><input name="email" type="email" required className="input w-72" /></label>
            <label><span className="label">Role</span><select name="role" className="input"><option>EDITOR</option><option>OWNER</option><option>VIEWER</option></select></label>
            <SubmitButton>Add</SubmitButton>
          </form>
          <p className="help mt-2">The user must exist first (Users page, super-admins only).</p>
        </Card>
      )}
    </>
  );
}
