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
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-6 sm:px-4">
          <Link href="/" className="flex shrink-0 items-center" aria-label="Sites Admin home">
            <Image
              src="/logo/logo.png"
              alt="Sites Admin logo"
              width={220}
              height={80}
              priority
              className="h-9 w-auto max-w-[92px] object-contain sm:h-15 sm:max-w-[190px]"
            />
          </Link>
          <nav className="flex gap-0 text-xs sm:gap-1 sm:text-sm">
            <Link href="/" className="rounded-md px-2 py-1.5 font-medium text-slate-600 sm:px-3 hover:bg-slate-100 hover:text-slate-900">Dashboard</Link>
            <Link href="/sites" className="rounded-md px-2 py-1.5 font-medium text-slate-600 sm:px-3 hover:bg-slate-100 hover:text-slate-900">Websites</Link>
            {user.globalRole === "SUPER_ADMIN" && <Link href="/users" className="rounded-md px-2 py-1.5 font-medium text-slate-600 sm:px-3 hover:bg-slate-100 hover:text-slate-900">Users</Link>}
          </nav>
          <div className="ml-auto flex items-center gap-2 text-sm sm:gap-3">
            <span className="hidden text-slate-500 sm:inline">{user.email}</span>
            <form action={logout}><button className="btn btn-secondary btn-sm">Sign out</button></form>
          </div>
        </div>
      </header>
      <Suspense><Flash /></Suspense>
      <div className="flex-1">{children}</div>
    </div>
  );
}
