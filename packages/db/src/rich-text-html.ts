import sanitizeHtml from "sanitize-html";
import { richTextElements, richTextHtmlPrefix } from "./rich-text";

export function sanitizeRichTextHtml(html: string, textFilter?: (text: string) => string) {
  return sanitizeHtml(html, {
    allowedTags: Object.keys(richTextElements),
    allowedAttributes: richTextElements,
    allowedSchemes: ["http", "https", "tel", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
    nonTextTags: ["script", "style", "textarea", "option", "iframe", "svg", "math"],
    exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
    textFilter,
  });
}

export function cleanRichText(value: string) {
  const text = value.trim();
  if (!text.startsWith(richTextHtmlPrefix)) return text;
  const html = sanitizeRichTextHtml(text.slice(richTextHtmlPrefix.length));
  return html ? richTextHtmlPrefix + html : "";
}

export function richTextPlainText(value: string, textFilter?: (text: string) => string) {
  if (!value.startsWith(richTextHtmlPrefix)) return value;
  return sanitizeRichTextHtml(value.slice(richTextHtmlPrefix.length), textFilter)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
}
