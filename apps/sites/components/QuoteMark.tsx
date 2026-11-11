import type { CSSProperties } from "react";
import type { DesignOptions } from "@platform/db";

type QuoteDesign = DesignOptions & {
  quoteSvgUrl?: string;
  quoteSvgColor?: string;
  quoteSvgHoverColor?: string;
};

/** Shared per-site quote art for the homepage About block and service pages. */
export function QuoteMark({ design, className }: { design: DesignOptions; className: string }) {
  const quote = design as QuoteDesign;
  const url = quote.quoteSvgUrl;
  const safeUrl = typeof url === "string" && /^\/images_nextjs\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.svg$/i.test(url);
  if (!safeUrl) return <span className={className} aria-hidden="true">//</span>;

  const color = typeof quote.quoteSvgColor === "string" && /^#[0-9a-fA-F]{6}$/.test(quote.quoteSvgColor)
    ? quote.quoteSvgColor : undefined;
  const hoverColor = typeof quote.quoteSvgHoverColor === "string" && /^#[0-9a-fA-F]{6}$/.test(quote.quoteSvgHoverColor)
    ? quote.quoteSvgHoverColor : color;

  if (color) {
    // CSS mask uses the SVG alpha channel so fill and stroke artwork take on one color.
    // The original file is untouched and is shown again if the color is reset.
    const style = {
      "--quote-svg-color": color,
      "--quote-svg-hover-color": hoverColor,
      maskImage: `url("${url}")`,
      WebkitMaskImage: `url("${url}")`,
    } as CSSProperties;
    return <span className={`${className} micks-quote-svg micks-quote-tinted`} style={style} aria-hidden="true" />;
  }

  // No tint means preserve the SVG file's own fills, strokes and any original colors.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" aria-hidden="true" className={`${className} micks-quote-svg`} />;
}
