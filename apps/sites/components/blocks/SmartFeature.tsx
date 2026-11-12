import Link from "next/link";
import { RichText } from "@/lib/format";
import { globalCtaHref, sharedToolConfig } from "@/lib/global-content";
import { localSiteHref } from "@/lib/url";
import { getDesign } from "@platform/db/theme";
import { CertificationBadges } from "../CertificationBadge";
import type { BlockComponentProps } from "./types";

function FeatureLink({ bundle, href, children }: {
  bundle: BlockComponentProps<"smart_feature">["bundle"];
  href: string;
  children: React.ReactNode;
}) {
  const design = getDesign(bundle.theme ?? {});
  const resolved = /^https?:\/\//i.test(href) ? href : globalCtaHref(design, href, String(children));
  if (/^https?:\/\//i.test(resolved)) {
    return <a href={resolved} target="_blank" rel="noopener noreferrer">{children}</a>;
  }
  return <Link href={localSiteHref(bundle.site.slug, resolved)}>{children}</Link>;
}

export function SmartFeature({ bundle, props, pageSlug }: BlockComponentProps<"smart_feature">) {
  const design = getDesign(bundle.theme ?? {});
  const tool = sharedToolConfig(bundle);
  const toolUrl = props.integration === "custom" ? undefined : tool?.url;
  const imageAlt = `${props.heading} at ${bundle.settings?.businessName ?? bundle.site.name}`;
  const ctaHref = props.variant === "tool" && toolUrl ? toolUrl : props.cta?.href;
  const cta = props.cta && ctaHref && <FeatureLink bundle={bundle} href={ctaHref}>{props.cta.label}</FeatureLink>;
  const pageClass = pageSlug === "tires" ? " micks-smart-feature-page-tires" : "";

  if (props.variant === "intro") {
    return <section className={`micks-smart-feature micks-smart-feature-intro${pageClass} section`}>
      <div className="container-site">
        {props.eyebrow && <p className="micks-smart-kicker">{props.eyebrow}</p>}
        <div className="micks-smart-feature-grid">
          <div className="micks-smart-feature-copy-wrap">
            <h2>{props.heading}</h2>
            <RichText text={props.body} className="micks-smart-feature-copy" />
            {cta}
            {(props.calloutHeading || props.calloutBody) && <aside className="micks-smart-feature-callout">
              {props.calloutHeading && <strong>{props.calloutHeading}</strong>}
              {props.calloutBody && <span>{props.calloutBody}</span>}
            </aside>}
            {props.supportText && <p className="micks-smart-support">{props.supportText}</p>}
          </div>
          {props.imageUrl && <img src={props.imageUrl} alt={imageAlt} />}
        </div>
      </div>
    </section>;
  }

  if (props.variant === "tool") {
    return <section className={`micks-smart-feature micks-smart-feature-tool${pageClass} section`} id={props.integration === "tire_finder" ? "tire-finder" : "tool"}>
      <div className="container-site">
        <header className="micks-smart-feature-heading">
          {props.eyebrow && <p className="micks-smart-kicker">{props.eyebrow}</p>}
          <h2>{props.heading}</h2>
          <RichText text={props.body} className="micks-smart-feature-copy" />
        </header>
        <div className="micks-smart-tool-panel">
          {props.secondaryImageUrl && <img className="micks-smart-tool-photo" src={props.secondaryImageUrl} alt="Vehicle diagnostic scan" />}
          <div className="micks-smart-tool-panel-copy">
            {props.imageUrl && <img className="micks-smart-tool-icon" src={props.imageUrl} alt="" />}
            {props.calloutHeading && <h3>{props.calloutHeading}</h3>}
            {props.calloutBody && <RichText text={props.calloutBody} />}
            {cta}
          </div>
        </div>
        {props.supportText && <p className="micks-smart-support">{props.supportText}</p>}
      </div>
    </section>;
  }

  return <section className={`micks-smart-feature micks-smart-feature-${props.variant}${pageClass} section`}>
    <div className="container-site">
      <div className="micks-smart-feature-grid">
        <div className="micks-smart-feature-copy-wrap">
          {props.eyebrow && <p className="micks-smart-kicker">{props.eyebrow}</p>}
          <h2>{props.heading}</h2>
          <RichText text={props.body} className="micks-smart-feature-copy" />
          {cta}
          {props.supportText && <p className="micks-smart-support">{props.supportText}</p>}
          {props.showCertifications && <CertificationBadges design={design} className="micks-smart-feature-certifications" />}
        </div>
        {props.imageUrl && <img src={props.imageUrl} alt={imageAlt} />}
      </div>
      {(props.calloutHeading || props.calloutBody) && <aside className="micks-smart-feature-callout">
        {props.calloutHeading && <strong>{props.calloutHeading}</strong>}
        {props.calloutBody && <span>{props.calloutBody}</span>}
      </aside>}
    </div>
  </section>;
}
