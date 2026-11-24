"use client";

import { useRef } from "react";
import { cloneSiteAction } from "@/lib/actions/sites";
import { SubmitButton } from "@/components/ConfirmButton";

export function CloneSiteDialog({ sourceId, siteName }: { sourceId: string; siteName: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => dialogRef.current?.showModal()}>
        Clone
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`clone-title-${sourceId}`}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/40"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        <form action={cloneSiteAction} className="space-y-3 p-5">
          <input type="hidden" name="sourceId" value={sourceId} />
          <div className="flex items-start justify-between gap-4">
            <p id={`clone-title-${sourceId}`} className="text-sm font-semibold">Clone “{siteName}”</p>
            <button type="button" className="text-xl leading-none text-slate-500 hover:text-slate-800" aria-label="Close dialog" onClick={() => dialogRef.current?.close()}>
              &times;
            </button>
          </div>
          <label className="block"><span className="label">New site name</span><input name="name" required className="input" placeholder="Smith Auto Care" /></label>
          <label className="block"><span className="label">Slug</span><input name="slug" className="input" placeholder="smith-auto-care" /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="includeTestimonials" /> Copy testimonials</label>
          <p className="help">Copies pages, branding, services and settings as a draft. Bookings and analytics IDs are not copied.</p>
          <SubmitButton className="btn btn-primary w-full">Clone site</SubmitButton>
        </form>
      </dialog>
    </>
  );
}
