"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function ActiveNavLink({ href, siteSlug, childHrefs = [], children }: {
  href: string;
  siteSlug: string;
  childHrefs?: string[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const normalize = (path: string) => {
    const parts = path.split(/[?#]/)[0].split("/").filter(Boolean);
    const route = parts[0] === siteSlug ? parts.slice(1)
      : ["s", "p"].includes(parts[0]) ? parts.slice(2) : parts;
    return `/${route.join("/")}`;
  };
  const current = normalize(pathname);
  const matches = (target: string) => {
    if (!target.startsWith("/") || target.startsWith("//")) return false;
    const route = normalize(target);
    return current === route || (route !== "/" && current.startsWith(`${route}/`));
  };
  const active = matches(href) || childHrefs.some(matches);

  return <Link href={href} className="micks-nav-link" aria-current={active ? "page" : undefined}>{children}</Link>;
}
