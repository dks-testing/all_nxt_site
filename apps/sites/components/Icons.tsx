type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24", "aria-hidden": true };
export const PhoneIcon = ({ className = "h-5 w-5" }: P) => (<svg {...base} className={className}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>);
export const PinIcon = ({ className = "h-5 w-5" }: P) => (<svg {...base} className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>);
export const ClockIcon = ({ className = "h-5 w-5" }: P) => (<svg {...base} className={className}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>);
export const CheckIcon = ({ className = "h-5 w-5" }: P) => (<svg {...base} className={className}><path d="M20 6 9 17l-5-5"/></svg>);
export const MenuIcon = ({ className = "h-6 w-6" }: P) => (<svg {...base} className={className}><path d="M4 6h16M4 12h16M4 18h16"/></svg>);
export const ArrowIcon = ({ className = "h-4 w-4" }: P) => (<svg {...base} className={className}><path d="M5 12h14M13 5l7 7-7 7"/></svg>);
export const ChevronIcon = ({ className = "h-4 w-4" }: P) => (<svg {...base} className={className}><path d="m6 9 6 6 6-6"/></svg>);
export const WrenchIcon = ({ className = "h-6 w-6" }: P) => (<svg {...base} className={className}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8z"/></svg>);
export function Stars({ value = 5, className = "h-4 w-4" }: { value?: number; className?: string }) {
  return (
    <span className="inline-flex text-amber-400" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className={className} fill={i <= Math.round(value) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
        </svg>
      ))}
    </span>
  );
}
