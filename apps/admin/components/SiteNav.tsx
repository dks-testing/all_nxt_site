"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const groups: { title: string; items: [string, string][] }[] = [
  { title: "Site", items: [["", "Overview"], ["global", "Global settings"], ["branding", "Branding"], ["business", "Business info"], ["media", "Media"], ...(process.env.NODE_ENV === "development" ? [] : [["domains", "Domains"] as [string, string]])] },
  { title: "Content", items: [["pages", "Pages"], ["c/services", "Services"], ["c/specials", "Specials"], ["c/banners", "Banners"], ["c/faqs", "FAQ"], ["c/testimonials", "Testimonials"], ["c/case-studies", "Case studies"], ["navigation", "Navigation"]] },
  { title: "Operations", items: [["booking", "Booking & appointments"], ["integrations", "Integrations"], ["c/redirects", "Redirects"], ["team", "Team"]] },
];

export function SiteNav({ siteId }: { siteId: string }) {
  const path = usePathname();
  const base = `/sites/${siteId}`;
  return (
    <nav className="space-y-5 py-1 text-sm">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{g.title}</p>
          {g.items.map(([href, label]) => {
            const full = href ? `${base}/${href}` : base;
            const active = href ? path.startsWith(full) : path === base;
            return (
              <Link key={href} href={full} className={`mb-0.5 block rounded-lg px-3 py-2 font-medium transition ${active ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
