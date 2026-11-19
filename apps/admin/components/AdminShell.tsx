"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { SiteNav } from "./SiteNav";

export function AdminShell({ children, name, email, isSuper, signOut }: {
  children: ReactNode;
  name: string;
  email: string;
  isSuper: boolean;
  signOut: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const siteId = pathname.match(/^\/sites\/([^/]+)/)?.[1];
  const inSite = siteId && siteId !== "new";
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const links = [{ href: "/", label: "Dashboard", icon: "dashboard" }, { href: "/sites", label: "Websites", icon: "sites" }, ...(isSuper ? [{ href: "/users", label: "Users", icon: "users" }] : [])];

  return (
    <div className={`admin-shell${collapsed ? " admin-shell--collapsed" : ""}`}>
      {open && <button className="admin-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <aside id="admin-navigation" className={`admin-navigation${open ? " admin-navigation--open" : ""}`}>
        <div className="admin-brand">
          <Link href="/" className="rounded-lg bg-white px-2 py-1" aria-label="Sites Admin home" onClick={() => setOpen(false)}>
            <Image src="/logo/logo.png" alt="Sites Admin" width={220} height={80} priority className="h-10 w-auto max-w-40 object-contain" />
          </Link>
          <button className="admin-icon-button admin-mobile-close" aria-label="Close navigation" onClick={() => setOpen(false)}><ShellIcon name="close" /></button>
        </div>
        <div className="admin-profile">
          <span className="admin-avatar" aria-hidden="true">{initials}</span>
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-100">{name}</p><p className="mt-1 text-xs text-slate-300">{isSuper ? "Administrator" : "Workspace member"}</p></div>
        </div>
        <div className="admin-navigation-scroll">
          <p className="admin-nav-label">Navigation</p>
          <nav aria-label="Main administration" className="space-y-1">
            {links.map(({ href, label, icon }) => {
              const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
              return <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={`admin-nav-link${active ? " admin-nav-link--active" : ""}`}><ShellIcon name={icon} /><span>{label}</span><span className="ml-auto text-base opacity-60" aria-hidden="true">›</span></Link>;
            })}
          </nav>
          {inSite && <div className="mt-7" onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setOpen(false); }}><SiteNav siteId={siteId} /></div>}
        </div>
        <div className="admin-navigation-footer"><span className="h-2 w-2 rounded-full bg-emerald-500" />Sites workspace</div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="flex min-w-0 items-center gap-4">
            <button className="admin-icon-button admin-menu-mobile" aria-label="Open navigation" aria-controls="admin-navigation" aria-expanded={open} onClick={() => setOpen(true)}><ShellIcon name="menu" /></button>
            <button className="admin-icon-button admin-menu-desktop" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} aria-controls="admin-navigation" aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}><ShellIcon name="menu" /></button>
            <div className="admin-breadcrumb"><span>Workspace</span><span aria-hidden="true">/</span><strong>{inSite ? "Website management" : pathname.startsWith("/users") ? "Users" : pathname.startsWith("/sites") ? "Websites" : "Dashboard"}</strong></div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <span className="hidden max-w-52 truncate text-xs text-slate-500 xl:inline">{email}</span>
            {signOut}
            <span className="admin-avatar admin-avatar--small" title={name} aria-label={name}>{initials}</span>
          </div>
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function ShellIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    sites: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M7 6.5h.01M10 6.5h.01M9 13l-2 2 2 2m6-4 2 2-2 2" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v2" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
  };
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
