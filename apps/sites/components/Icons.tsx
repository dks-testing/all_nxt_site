type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24", "aria-hidden": true };
export const PhoneIcon = ({ className = "h-5 w-5" }: P) => (<svg aria-hidden="true" className={className} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z"/></svg>);
export const PinIcon = ({ className = "h-5 w-5" }: P) => (<svg aria-hidden="true" className={className} viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"/></svg>);
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
