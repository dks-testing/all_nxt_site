"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { widgetButtonBaseFromHref, widgetButtonHrefPrefix } from "@platform/db/widget-buttons";

export function WidgetButtonIds({ siteName }: { siteName: string }) {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const assignIds = () => {
      const counters = new Map<string, number>();
      const buttons = document.querySelectorAll<HTMLElement>(`a[href^="${widgetButtonHrefPrefix}"], [data-widget-button-base]`);
      for (const button of buttons) {
        const base = widgetButtonBaseFromHref(button.getAttribute("href")) ?? widgetButtonBaseFromHref(`${widgetButtonHrefPrefix}${button.dataset.widgetButtonBase ?? ""}`);
        if (!base) continue;
        const sequence = (counters.get(base) ?? 0) + 1;
        counters.set(base, sequence);
        button.dataset.widgetButtonBase = base;
        button.id = `${base}-${siteName}-${String(sequence).padStart(3, "0")}`;
        button.removeAttribute("href");
        button.setAttribute("role", "button");
        button.tabIndex = 0;
      }
    };

    // The third-party loader scans the stable hidden bridge buttons on
    // DOMContentLoaded. Assign visible IDs immediately afterward so it cannot
    // add duplicate direct listeners to them.
    let assignmentTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleAssignment = () => { assignmentTimer = setTimeout(assignIds, 0); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scheduleAssignment, { once: true });
    else assignIds();

    const activateWithKeyboard = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>("[data-widget-button-base]") : null;
      if (!target || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      target.click();
    };
    const activateWidget = (event: MouseEvent) => {
      const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>("[data-widget-button-base]") : null;
      if (!target) return;
      event.preventDefault();
      // Buttons present during loader initialization already have the vendor's
      // direct listener. Buttons introduced by client navigation use the stable
      // bridge instead.
      if (target.dataset.widgetLoaderBound === "true") return;
      const base = target.dataset.widgetButtonBase;
      if (!base) return;
      document.querySelector<HTMLButtonElement>(`[data-widget-loader-bridge="${base}"]`)?.click();
    };
    document.addEventListener("keydown", activateWithKeyboard);
    document.addEventListener("click", activateWidget, true);
    return () => {
      if (assignmentTimer) clearTimeout(assignmentTimer);
      document.removeEventListener("DOMContentLoaded", scheduleAssignment);
      document.removeEventListener("keydown", activateWithKeyboard);
      document.removeEventListener("click", activateWidget, true);
    };
  }, [pathname, siteName]);

  return null;
}
