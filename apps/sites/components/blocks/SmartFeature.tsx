import { RichText } from "@/lib/format";
import { sharedToolConfig } from "@/lib/global-content";
import { getDesign } from "@platform/db/theme";
import { CertificationBadges } from "../CertificationBadge";
import { FeatureLink } from "./FeatureLink";
import type { BlockComponentProps } from "./types";

export function SmartFeature({ bundle, props, pageSlug }: BlockComponentProps<"smart_feature">) {
  const design = getDesign(bundle.theme ?? {});
  const tool = sharedToolConfig(bundle);
  const toolUrl = props.integration === "custom" ? undefined : tool?.url;
  const imageAlt = `${props.heading} at ${bundle.settings?.businessName ?? bundle.site.name}`;
  const ctaHref = props.variant === "tool" && toolUrl ? toolUrl : props.cta?.href;
  const toolKind = props.integration === "ai_diagnostic" ? "diagnostics" : props.integration === "tire_finder" ? "tires" : undefined;
  const cta = props.cta && ctaHref && (
    <FeatureLink
      bundle={bundle}
      href={ctaHref}
      className={props.variant === "final" ? "micks-smart-feature-compact-button" : undefined}
      toolKind={toolKind}
    >
      {props.cta.label}
    </FeatureLink>
  );
  const innerToolPage = pageSlug === "diagnostics" || pageSlug === "tires";
  const pageClass = pageSlug === "tires"
    ? " micks-smart-feature-page-tires"
    : pageSlug === "diagnostics"
      ? " micks-smart-feature-page-diagnostics"
      : "";

  if (props.variant === "intro") {
    return <section className={`micks-smart-feature micks-smart-feature-intro${pageClass} section`}>
      <div className="container-site">
        {props.eyebrow && (innerToolPage
          ? <h2 className="micks-smart-kicker">{props.eyebrow}</h2>
          : <p className="micks-smart-kicker">{props.eyebrow}</p>)}
        <div className="micks-smart-feature-grid">
          <div className="micks-smart-feature-copy-wrap flex flex-col justify-center h-full">
            {innerToolPage ? <h3>{props.heading}</h3> : <h2>{props.heading}</h2>}
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
            {(props.iconUrl || props.imageUrl) && <img className="micks-smart-tool-icon" src={props.iconUrl || props.imageUrl} alt="" />}
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
        {props.imageUrl && (props.variant === "cta"
          ? <div className="micks-smart-feature-media"><img src={props.imageUrl} alt={imageAlt} /></div>
          : <img src={props.imageUrl} alt={imageAlt} />)}
      </div>
      {(props.calloutHeading || props.calloutBody) && <aside className="micks-smart-feature-callout">
        {props.calloutHeading && <strong>{props.calloutHeading}</strong>}
        {props.calloutBody && <span>{props.calloutBody}</span>}
      </aside>}
    </div>
  </section>;
}
