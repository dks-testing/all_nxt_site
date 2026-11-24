import type { Address, DayHours, SiteBundle } from "@platform/db";
import { Fragment } from "react";
import { legacyRichTextHtml, richTextHtmlPrefix } from "@platform/db/rich-text";
import { sanitizeRichTextHtml } from "@platform/db/rich-text-html";
import { globalText } from "./global-content";

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

export function RichText({ text, className = "prose-site", bundle }: { text?: string | null; className?: string; bundle?: SiteBundle }) {
  if (!text) return null;
  if (!text.startsWith(richTextHtmlPrefix)) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: legacyRichTextHtml(text) }} />;
  }
  const html = sanitizeRichTextHtml(text.slice(richTextHtmlPrefix.length), bundle && ((copy) => globalText(copy, bundle, true)));
  return html ? <div className={`${className} rich-text-content`} dangerouslySetInnerHTML={{ __html: html }} /> : null;
}

export function TextWithBreaks({ text }: { text: string }) {
  return <>{text.split(/(<br\s*\/?>|\r\n|\r|\n)/gi).map((part, index) =>
    /^(?:<br\s*\/?>|\r\n|\r|\n)$/i.test(part) ? <br key={index} /> : <Fragment key={index}>{part}</Fragment>,
  )}</>;
}
