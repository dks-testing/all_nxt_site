import type { CSSProperties } from "react";
import type { DesignOptions } from "@platform/db";
import { WrenchIcon } from "./Icons";

const safeSvg = (value?: string) => typeof value === "string" && /^\/images_nextjs\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.svg$/i.test(value);
const safeColor = (value?: string) => typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : undefined;

export function StepListIcon({ design, label }: { design: DesignOptions; label: string }) {
  const url = design.serviceStepIconUrl || design.serviceTrustIconUrls?.[0];
  const color = safeColor(design.serviceStepIconColor || design.serviceTrustIconColor);
  const hover = safeColor(design.serviceStepIconHoverColor || design.serviceTrustIconHoverColor) || color;
  if (!safeSvg(url)) {
    return <span className="micks-step-icon micks-step-icon-fallback" role="img" aria-label={`${label} icon`}><WrenchIcon /></span>;
  }
  if (color) {
    const style = {
      "--step-icon-color": color,
      "--step-icon-hover-color": hover,
      maskImage: `url("${url}")`,
      WebkitMaskImage: `url("${url}")`,
    } as CSSProperties;
    return <span className="micks-step-icon micks-step-icon-tinted" style={style} role="img" aria-label={`${label} icon`} />;
  }
  return <img src={url} className="micks-step-icon" alt={`${label} icon`} />;
}
