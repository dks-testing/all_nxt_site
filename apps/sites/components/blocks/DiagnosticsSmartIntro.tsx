import { RichText } from "@/lib/format";
import { FeatureLink } from "./FeatureLink";
import type { BlockComponentProps } from "./types";

export function DiagnosticsSmartIntro({ bundle, props }: Pick<BlockComponentProps<"smart_feature">, "bundle" | "props">) {
  const imageAlt = `${props.heading} at ${bundle.settings?.businessName ?? bundle.site.name}`;

  return <section className="micks-diagnostics-intro section">
    <div className="container-site">
      {props.eyebrow && <p className="micks-diagnostics-intro-kicker">{props.eyebrow}</p>}
      <div className="micks-diagnostics-intro-grid">
        <div className="micks-diagnostics-intro-copy-wrap">
          <h2>{props.heading}</h2>
          <RichText text={props.body} className="micks-diagnostics-intro-copy" />
          {props.cta && props.cta.href && <FeatureLink bundle={bundle} href={props.cta.href}>{props.cta.label}</FeatureLink>}
          {(props.calloutHeading || props.calloutBody) && <aside className="micks-diagnostics-intro-callout">
            {props.calloutHeading && <strong>{props.calloutHeading}</strong>}
            {props.calloutBody && <span>{props.calloutBody}</span>}
          </aside>}
          {props.supportText && <p className="micks-diagnostics-intro-support">{props.supportText}</p>}
        </div>
        {props.imageUrl && <img src={props.imageUrl} alt={imageAlt} />}
      </div>
    </div>
  </section>;
}

