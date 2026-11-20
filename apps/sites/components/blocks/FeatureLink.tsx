import { globalCta, smartToolKind, smartToolUrl } from "@/lib/global-content";
import { localSiteHref } from "@/lib/url";
import { getDesign } from "@platform/db/theme";
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
  const action = globalCta(design, href, String(children));
  const resolved = /^https?:\/\//i.test(href) ? href : action.href;
  const kind = toolKind ?? smartToolKind(href, String(children));
  return <ToolPopupLink
    href={/^https?:\/\//i.test(resolved) ? resolved : localSiteHref(bundle.site.slug, resolved)}
    label={action.label}
    src={kind ? smartToolUrl(bundle, kind) : undefined}
    className={className}
  />;
}
