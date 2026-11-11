"use client";
import { useFormStatus } from "react-dom";

/** Submit button with optional confirm() and pending state. */
export function SubmitButton({ children, confirm: msg, className = "btn btn-primary", name, value }: { children: React.ReactNode; confirm?: string; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (msg && !window.confirm(msg)) e.preventDefault();
      }}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
