import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { Flash } from "@/components/Flash";
import { AdminShell } from "@/components/AdminShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AdminShell name={user.name || user.email} email={user.email} isSuper={user.globalRole === "SUPER_ADMIN"} signOut={<form action={logout}><button className="btn btn-secondary btn-sm">Sign out</button></form>}>
      <Suspense><Flash /></Suspense>
      <div className="flex-1">{children}</div>
    </AdminShell>
  );
}
