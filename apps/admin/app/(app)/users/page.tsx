import { getDb, users, sites, siteMembers, eq, desc } from "@platform/db";
import { requireSuperAdmin } from "@/lib/auth";
import { createUser } from "@/lib/actions/content";
import { PageHeader, Card, Input, Select } from "@/components/ui";
import { SubmitButton } from "@/components/ConfirmButton";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  await requireSuperAdmin();
  const db = getDb();
  const rows = await db.select().from(users).orderBy(desc(users.createdAt));
  const memberships = await db.select({ userId: siteMembers.userId, role: siteMembers.role, site: sites.name }).from(siteMembers).innerJoin(sites, eq(sites.id, siteMembers.siteId));
  const allSites = await db.select({ id: sites.id, name: sites.name }).from(sites).orderBy(sites.name);
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader title="Users" description="Super-admins manage every site. Shop owners get access to their own site only." />
      <div className="card mb-6 overflow-x-auto">
        <table className="table">
          <thead><tr><th>User</th><th>Role</th><th>Sites</th><th>Created</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td><div className="font-semibold">{u.name ?? u.email}</div><div className="text-xs text-slate-500">{u.email}</div></td>
                <td>{u.globalRole === "SUPER_ADMIN" ? <span className="font-semibold text-[var(--color-brand)]">Super-admin</span> : "User"}</td>
                <td className="text-xs">{u.globalRole === "SUPER_ADMIN" ? "All" : memberships.filter((m) => m.userId === u.id).map((m) => `${m.site} (${m.role.toLowerCase()})`).join(", ") || "–"}</td>
                <td className="text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card title="Create user">
        <form action={createUser} className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" name="email" type="email" required />
          <Input label="Name" name="name" />
          <Input label="Temporary password" name="password" type="password" required help="At least 10 characters. Share it securely." />
          <Select label="Platform role" name="globalRole" options={[{ value: "USER", label: "User (site access only)" }, { value: "SUPER_ADMIN", label: "Super-admin" }]} />
          <Select label="Give access to site" name="siteId" options={[{ value: "", label: "None yet" }, ...allSites.map((s) => ({ value: s.id, label: s.name }))]} />
          <Select label="Site role" name="role" options={["EDITOR", "OWNER", "VIEWER"]} />
          <div className="sm:col-span-2"><SubmitButton>Create user</SubmitButton></div>
        </form>
      </Card>
    </main>
  );
}
