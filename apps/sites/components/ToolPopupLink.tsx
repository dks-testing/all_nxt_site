"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function ToolPopupLink({
  href,
  label,
  src,
  className,
  children,
}: {
  href: string;
  label: string;
  src?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.classList.add("micks-tool-popup-open");
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.classList.remove("micks-tool-popup-open");
    };
  }, [open]);

  const external = /^https?:\/\//i.test(href);
  const content = children ?? <span>{label}</span>;
  return <>
    {src
      ? <button type="button" className={className} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>{content}</button>
      : external
        ? <a href={href} className={className} target="_blank" rel="noopener noreferrer">{content}</a>
        : <Link href={href} className={className}>{content}</Link>}
    {open && src && <div className="micks-tool-popup" onClick={(event) => {
      if (event.target === event.currentTarget) setOpen(false);
    }}>
      <section className="micks-tool-popup-dialog" role="dialog" aria-modal="true" aria-label={label}>
        <button type="button" className="micks-tool-popup-close" autoFocus onClick={() => setOpen(false)}>Close</button>
        <iframe src={src} title={label} />
      </section>
    </div>}
  </>;
}
