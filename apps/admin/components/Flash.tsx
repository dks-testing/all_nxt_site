"use client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

/** Shows ?ok=... / ?error=... messages set by server actions after redirect, then clears them. */
export function Flash() {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const ok = sp.get("ok");
  const error = sp.get("error");
  useEffect(() => {
    if (!ok && !error) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(sp.toString());
      next.delete("ok");
      next.delete("error");
      router.replace(next.size ? `${path}?${next}` : path, { scroll: false });
    }, 4000);
    return () => clearTimeout(t);
  }, [ok, error, sp, router, path]);
  if (!ok && !error) return null;
  return (
    <div role="status" className={`fixed right-4 top-4 z-50 max-w-sm rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${error ? "bg-rose-600 text-white" : "bg-slate-900 text-white"}`}>
      {error ?? ok}
    </div>
  );
}
