"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const groups: { title: string; items: [string, string][] }[] = [
  { title: "Site", items: [["", "Dashboard"], ["global", "Global settings"], ["branding", "Branding"], ["business", "Business info"], ["media", "Media library"], ...(process.env.NODE_ENV === "development" ? [] : [["domains", "Domains"] as [string, string]])] },
  { title: "Content", items: [["pages", "Pages"], ["c/services", "Services"], ["c/specials", "Specials"], ["c/banners", "Banners"], ["c/faqs", "FAQ"], ["c/testimonials", "Testimonials"], ["c/case-studies", "Case studies"], ["navigation", "Header & footer"]] },
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
              <Link key={href} href={full} className={`group mb-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium transition ${active ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : "bg-slate-300 transition group-hover:bg-indigo-500"}`} aria-hidden="true" />{label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
