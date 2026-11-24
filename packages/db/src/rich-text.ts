export const richTextHtmlPrefix = "<!-- rich-text -->";

export const richTextElements = {
  p: [], br: [],
  h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
  strong: [], b: [], em: [], i: [],
  ul: [], ol: ["start"], li: [],
  a: ["href", "title"],
  img: ["src", "alt", "title", "width", "height"],
};

export function escapeHtmlText(text: string) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function legacyRichTextHtml(text: string) {
  const bulletPrefix = /^(?:-|\*|•)\s+/;
  const inline = (line: string) => escapeHtmlText(line).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  return text.replaceAll("\r", "").split(/\n{2,}/).map((block) => {
    const lines = block.split("\n");
    if (lines.every((line) => bulletPrefix.test(line.trim()))) {
      const bullets = lines.map((line) => `<li>${inline(line.trim().replace(bulletPrefix, ""))}</li>`);
      return `<ul>${bullets.join("")}</ul>`;
    }
    return `<p>${lines.map(inline).join("<br>")}</p>`;
  }).join("");
}
