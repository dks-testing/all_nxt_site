"use client";

import { useRef } from "react";

export function SortableSections({ action, siteId, pageId, children }: { action: (data: FormData) => void | Promise<void>; siteId: string; pageId: string; children: React.ReactNode }) {
  const list = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const order = useRef<HTMLInputElement>(null);
  const dragging = useRef<HTMLElement | null>(null);
  return <>
    <div ref={list} className="space-y-3" onDragStart={(event) => {
      const handle = (event.target as HTMLElement).closest("[data-drag-handle]");
      const row = handle?.closest("[data-section-id]") as HTMLElement | null;
      if (!row) return;
      dragging.current = row;
      row.classList.add("opacity-50");
      event.dataTransfer.effectAllowed = "move";
    }} onDragOver={(event) => {
      if (!dragging.current || !list.current) return;
      const target = (event.target as HTMLElement).closest("[data-section-id]") as HTMLElement | null;
      if (!target || target === dragging.current) return;
      event.preventDefault();
      const box = target.getBoundingClientRect();
      list.current.insertBefore(dragging.current, event.clientY < box.top + box.height / 2 ? target : target.nextSibling);
    }} onDragEnd={() => {
      if (!dragging.current || !list.current || !order.current) return;
      dragging.current.classList.remove("opacity-50");
      dragging.current = null;
      order.current.value = JSON.stringify(Array.from(list.current.querySelectorAll<HTMLElement>("[data-section-id]")).map((row) => row.dataset.sectionId));
      form.current?.requestSubmit();
    }}>{children}</div>
    <form ref={form} action={action} className="hidden"><input name="siteId" value={siteId} readOnly /><input name="pageId" value={pageId} readOnly /><input ref={order} name="order" readOnly /></form>
  </>;
}
