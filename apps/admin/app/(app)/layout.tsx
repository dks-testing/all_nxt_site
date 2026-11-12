import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { Flash } from "@/components/Flash";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex w-full flex-1 flex-col">
      <header className="admin-topbar sticky top-0 z-40">
        <div className="mx-auto flex h-[4.5rem] max-w-[90rem] items-center gap-2 px-4 sm:gap-7 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center" aria-label="Sites Admin home">
            <Image
              src="/logo/logo.png"
              alt="Sites Admin logo"
              width={220}
              height={80}
              priority
              className="h-10 w-auto max-w-[110px] object-contain sm:max-w-[180px]"
            />
          </Link>
          <nav className="flex gap-0 text-xs sm:gap-1 sm:text-sm" aria-label="Main administration">
            <Link href="/" className="topbar-link">Dashboard</Link>
            <Link href="/sites" className="topbar-link">Websites</Link>
            {user.globalRole === "SUPER_ADMIN" && <Link href="/users" className="topbar-link">Users</Link>}
          </nav>
          <div className="ml-auto flex items-center gap-2 text-sm sm:gap-3">
            <span className="hidden max-w-52 truncate text-slate-500 lg:inline">{user.email}</span>
            <form action={logout}><button className="btn btn-secondary btn-sm">Sign out</button></form>
          </div>
        </div>
      </header>
      <Suspense><Flash /></Suspense>
      <div className="flex-1">{children}</div>
    </div>
  );
}
