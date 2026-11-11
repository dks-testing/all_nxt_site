import { redirect } from "next/navigation";

/** Runs a mutation and redirects back with a flash message (?ok= / ?error=). */
export async function run(back: string, fn: () => Promise<string | { ok: string; to?: string }>): Promise<never> {
  let to = back;
  let qs: string;
  try {
    const r = await fn();
    const msg = typeof r === "string" ? r : r.ok;
    if (typeof r !== "string" && r.to) to = r.to;
    qs = `ok=${encodeURIComponent(msg)}`;
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e;
    console.error(e);
    qs = `error=${encodeURIComponent(e instanceof Error ? e.message : "Something went wrong")}`;
  }
  redirect(`${to}${to.includes("?") ? "&" : "?"}${qs}`);
}
