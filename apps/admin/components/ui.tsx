import type { SiteStatus } from "@platform/db";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, children, className = "", actions }: { title?: string; description?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={`card p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

type FieldProps = { label: string; name: string; help?: string; className?: string };

export function Input({ label, name, help, className = "", ...rest }: FieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      <input name={name} className="input" {...rest} />
      {help && <p className="help">{help}</p>}
    </label>
  );
}

export function Textarea({ label, name, help, className = "", rows = 4, ...rest }: FieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      <textarea name={name} rows={rows} className="input" {...rest} />
      {help && <p className="help">{help}</p>}
    </label>
  );
}

export function Select({ label, name, help, options, className = "", ...rest }: FieldProps & { options: (string | { value: string; label: string })[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      <select name={name} className="input" {...rest}>
        {options.map((o) => (typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
      {help && <p className="help">{help}</p>}
    </label>
  );
}

export function Checkbox({ label, name, defaultChecked, help }: { label: string; name: string; defaultChecked?: boolean; help?: string }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-[var(--color-brand)]" />
      <span><span className="font-medium">{label}</span>{help && <span className="block text-xs text-slate-500">{help}</span>}</span>
    </label>
  );
}

const statusStyles: Record<SiteStatus, string> = {
  PUBLISHED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-500/20",
  UNPUBLISHED: "bg-amber-50 text-amber-800 ring-amber-600/20",
  ARCHIVED: "bg-rose-50 text-rose-700 ring-rose-600/20",
};
export function StatusBadge({ status }: { status: SiteStatus }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{children}</div>;
}
