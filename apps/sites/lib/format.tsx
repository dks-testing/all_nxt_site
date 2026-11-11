import type { Address, DayHours } from "@platform/db";
import { Fragment } from "react";

export const telHref = (phone?: string | null) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : undefined);

export function formatAddress(a?: Address | null, oneLine = true) {
  if (!a) return "";
  const l2 = `${a.city}, ${a.region} ${a.postalCode}`;
  return oneLine ? `${a.street}, ${l2}` : `${a.street}\n${l2}`;
}

const to12 = (t?: string) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "pm" : "am";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")}${ap}`;
};

/** Groups consecutive days with equal hours: "Mon–Fri 7:30am–5:00pm", "Sat–Sun Closed". */
export function groupHours(hours?: DayHours[] | null) {
  if (!hours?.length) return [];
  const label = (h: DayHours) => (h.closed ? "Closed" : `${to12(h.open)} – ${to12(h.close)}`);
  const out: { days: string; time: string }[] = [];
  let start = 0;
  for (let i = 1; i <= hours.length; i++) {
    if (i === hours.length || label(hours[i]) !== label(hours[start])) {
      out.push({ days: i - 1 === start ? hours[start].day : `${hours[start].day}–${hours[i - 1].day}`, time: label(hours[start]) });
      start = i;
    }
  }
  return out;
}

const DAY_SCHEMA: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
export const schemaHours = (hours?: DayHours[] | null) =>
  (hours ?? []).filter((h) => !h.closed && h.open && h.close).map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: DAY_SCHEMA[h.day], opens: h.open, closes: h.close }));

/** Very small, safe text renderer: blank line = paragraph, "- " lines = bullets, **bold**. No HTML passthrough. */
export function RichText({ text, className = "prose-site" }: { text?: string | null; className?: string }) {
  if (!text) return null;
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
    );
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.every((l) => l.trim().startsWith("- ")))
          return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.trim().slice(2))}</li>)}</ul>;
        return <p key={i}>{lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l)}</Fragment>)}</p>;
      })}
    </div>
  );
}
