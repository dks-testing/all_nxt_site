import Link from "next/link";
import { globalCtaHref } from "@/lib/global-content";
import { localSiteHref } from "@/lib/url";
import { getDesign } from "@platform/db/theme";
import type { BlockComponentProps } from "./types";

export function FeatureLink({ bundle, href, children }: {
  bundle: BlockComponentProps<"smart_feature">["bundle"];
  href: string;
  children: React.ReactNode;
}) {
  const design = getDesign(bundle.theme ?? {});
  const resolved = /^https?:\/\//i.test(href) ? href : globalCtaHref(design, href, String(children));
  if (/^https?:\/\//i.test(resolved)) {
    return <a href={resolved} target="_blank" rel="noopener noreferrer"><span>{children}</span></a>;
  }
  return <Link href={localSiteHref(bundle.site.slug, resolved)}><span>{children}</span></Link>;
}
