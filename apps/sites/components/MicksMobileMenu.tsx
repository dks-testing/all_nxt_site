"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronIcon, MenuIcon } from "./Icons";

type MobileLink = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export function MicksMobileMenu({ name, logoUrl, homeHref, links }: { name: string; logoUrl?: string | null; homeHref: string; links: MobileLink[] }) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setClosing(false);
    setVisible(true);
  }

  function closeMenu() {
    if (!visible || closing) return;
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 360);
  }

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("micks-menu-open");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("micks-menu-open");
    };
  }, [visible, closing]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  return <div className="micks-mobile-menu">
    <button type="button" className="micks-mobile-menu-trigger" aria-label="Open menu" aria-expanded={visible} onClick={openMenu}><MenuIcon /></button>
    {visible && <div className={`micks-mobile-menu-layer ${closing ? "is-closing" : "is-opening"}`}>
      <button type="button" className="micks-mobile-menu-overlay" aria-label="Close menu" onClick={closeMenu} />
      <nav aria-label="Mobile navigation" className="micks-mobile-menu-list">
        <div className="micks-mobile-menu-head">
          <Link href={homeHref} aria-label={`${name} home`} onClick={closeMenu}>
            {logoUrl ? <img src={logoUrl} alt={name} /> : <strong>{name}</strong>}
          </Link>
        </div>
        <button type="button" className="micks-mobile-menu-close" aria-label="Close menu" onClick={closeMenu} />
        <div className="micks-mobile-menu-links">
          {links.map((item, index) => {
            if (!item.children?.length) {
              return <Link href={item.href} key={item.href + item.label} onClick={closeMenu}>{item.label}</Link>;
            }
            const submenuId = `micks-mobile-submenu-${index}`;
            const isOpen = openSubmenu === submenuId;
            return <div className="micks-mobile-menu-item" key={item.href + item.label}>
              <div className="micks-mobile-menu-item-row">
                <Link href={item.href} onClick={closeMenu}>{item.label}</Link>
                <button
                  type="button"
                  className="micks-mobile-submenu-toggle"
                  aria-label={`${isOpen ? "Hide" : "Show"} ${item.label} submenu`}
                  aria-expanded={isOpen}
                  aria-controls={submenuId}
                  onClick={() => setOpenSubmenu(isOpen ? null : submenuId)}
                >
                  <ChevronIcon />
                </button>
              </div>
              {isOpen && <div id={submenuId} className="micks-mobile-submenu-links">
                {item.children.map((child) => <Link href={child.href} key={child.href} onClick={closeMenu}>{child.label}</Link>)}
              </div>}
            </div>;
          })}
        </div>
      </nav>
    </div>}
  </div>;
}
