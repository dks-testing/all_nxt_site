import { globalCta, smartToolKind, smartToolUrl } from "@/lib/global-content";
import { localSiteHref } from "@/lib/url";
import { getDesign, isGlobalButtonEnabled } from "@platform/db/theme";
import { ToolPopupLink } from "../ToolPopupLink";
import type { BlockComponentProps } from "./types";

export function FeatureLink({ bundle, href, className, toolKind, children }: {
  bundle: BlockComponentProps<"smart_feature">["bundle"];
  href: string;
  className?: string;
  children: React.ReactNode;
  toolKind?: "diagnostics" | "tires";
}) {
  const design = getDesign(bundle.theme ?? {});
  const kind = toolKind ?? smartToolKind(href, String(children));
  const action = globalCta(design, href, String(children), kind);
  if (!action || (kind && !isGlobalButtonEnabled(design, kind))) return null;
  const useWidgetId = Boolean(kind && design.globalButtonIds?.[kind] && !design[`${kind}CtaHref`]);
  const resolved = useWidgetId ? action.href : /^https?:\/\//i.test(href) ? href : action.href;
  return <ToolPopupLink
    href={/^https?:\/\//i.test(resolved) ? resolved : localSiteHref(bundle.site.slug, resolved)}
    label={action.label}
    src={kind ? smartToolUrl(bundle, kind) : undefined}
    className={className}
  />;
}
