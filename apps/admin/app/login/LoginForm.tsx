"use client";
import { useActionState, useState } from "react";
import { login } from "@/lib/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, null);
  const [email, setEmail] = useState("");
  return (
    <form action={action} className="card space-y-4 p-6">
      <input type="hidden" name="next" value={next} />
      <label className="block"><span className="label">Email</span><input name="email" type="email" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="block"><span className="label">Password</span><input name="password" type="password" autoComplete="current-password" required className="input" /></label>
      {state?.error && <p className="rounded-md bg-rose-50 p-2.5 text-sm text-rose-700" role="alert">{state.error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
