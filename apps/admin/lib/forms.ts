/** Small FormData helpers for server actions. */
export const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const opt = (fd: FormData, k: string) => str(fd, k) || null;
export const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
export const int = (fd: FormData, k: string, fallback = 0) => {
  const n = parseInt(str(fd, k), 10);
  return Number.isFinite(n) ? n : fallback;
};
export const lines = (v: string) => v.split("\n").map((l) => l.trim()).filter(Boolean);
export const emails = (v: string) => lines(v.replace(/,/g, "\n"));
