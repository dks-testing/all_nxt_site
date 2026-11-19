import Link from "next/link";
import { globalCta } from "@/lib/global-content";
import { localSiteHref } from "@/lib/url";
import { getDesign } from "@platform/db/theme";
import type { BlockComponentProps } from "./types";

export function FeatureLink({ bundle, href, children }: {
  bundle: BlockComponentProps<"smart_feature">["bundle"];
  href: string;
  children: React.ReactNode;
}) {
  const design = getDesign(bundle.theme ?? {});
  const action = globalCta(design, href, String(children));
  const resolved = /^https?:\/\//i.test(href) ? href : action.href;
  if (/^https?:\/\//i.test(resolved)) {
    return <a href={resolved} target="_blank" rel="noopener noreferrer"><span>{action.label}</span></a>;
  }
  return <Link href={localSiteHref(bundle.site.slug, resolved)}><span>{action.label}</span></Link>;
}
