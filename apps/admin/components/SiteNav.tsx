"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const groups: { title: string; items: [string, string][] }[] = [
  { title: "Site", items: [["", "Dashboard"], ["global", "Global settings"], ["branding", "Branding"], ["business", "Business info"], ["media", "Media library"], ...(process.env.NODE_ENV === "development" ? [] : [["domains", "Domains"] as [string, string]])] },
  { title: "Content", items: [["pages", "Pages"], ["c/services", "Services"], ["c/banners", "Banners"], ["c/faqs", "FAQ"], ["c/testimonials", "Testimonials"], ["c/case-studies", "Case studies"], ["navigation", "Header & footer"]] },
  { title: "Operations", items: [["booking", "Booking & appointments"], ["integrations", "Integrations"], ["c/redirects", "Redirects"], ["team", "Team"]] },
];

export function SiteNav({ siteId }: { siteId: string }) {
  const path = usePathname();
  const base = `/sites/${siteId}`;
  return (
    <nav className="space-y-6 py-1 text-sm" aria-label="Website administration">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">{g.title}</p>
          {g.items.map(([href, label]) => {
            const full = href ? `${base}/${href}` : base;
            const active = href ? path.startsWith(full) : path === base;
            return (
              <Link key={href} href={full} aria-current={active ? "page" : undefined} className={`admin-site-link mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-medium transition${active ? " admin-site-link--active" : ""}`}>
                <span className="admin-site-link__dot h-1.5 w-1.5 shrink-0 rounded-full" aria-hidden="true" />{label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
