import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";
export { SESSION_COOKIE, createSessionToken } from "./session";
import { getDb, users, siteMembers, eq, and, type SiteRole } from "@platform/db";

export type SessionUser = { id: string; email: string; name: string | null; globalRole: "SUPER_ADMIN" | "USER" };

export async function getUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const id = await verifySessionToken(token);
  if (!id) return null;
  const [u] = await getDb()
    .select({ id: users.id, email: users.email, name: users.name, globalRole: users.globalRole })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return u ?? null;
}

export async function requireUser() {
  const u = await getUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireSuperAdmin() {
  const u = await requireUser();
  if (u.globalRole !== "SUPER_ADMIN") redirect("/");
  return u;
}

const rank: Record<SiteRole, number> = { VIEWER: 1, EDITOR: 2, OWNER: 3 };

/** Returns the user's role on a site, or null. Super-admins are OWNER everywhere. */
export async function siteRole(user: SessionUser, siteId: string): Promise<SiteRole | null> {
  if (user.globalRole === "SUPER_ADMIN") return "OWNER";
  const [m] = await getDb()
    .select({ role: siteMembers.role })
    .from(siteMembers)
    .where(and(eq(siteMembers.userId, user.id), eq(siteMembers.siteId, siteId)))
    .limit(1);
  return m?.role ?? null;
}

/** Use at the top of every server action / page that touches a site. */
export async function requireSiteAccess(siteId: string, min: SiteRole = "EDITOR") {
  const user = await requireUser();
  const role = await siteRole(user, siteId);
  if (!role || rank[role] < rank[min]) throw new Error("You don't have permission to do that on this site.");
  return { user, role };
}
