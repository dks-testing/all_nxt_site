import Link from "next/link";
import { RichText } from "@/lib/format";
import { CheckIcon, WrenchIcon } from "../Icons";
import type { BlockComponentProps } from "./types";
import { localSiteHref } from "@/lib/url";
import { getDesign } from "@platform/db/theme";
import { CertificationBadges } from "../CertificationBadge";
import { QuoteMark } from "../QuoteMark";
import { globalCtaHref, sharedToolConfig } from "@/lib/global-content";

export function TrustCards({ props }: BlockComponentProps<"trust_cards">) {
  if (!props.items.length) return null;
  return (
    <section className="section bg-[var(--color-surface)]">
      <div className="container-site">
        {props.heading && <h2 className="mb-10 text-center text-3xl font-bold uppercase">{props.heading}</h2>}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {props.items.map((it) => (
            <div key={it.title} className="rounded-site border-t-4 border-[var(--color-primary)] bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-bold uppercase leading-tight">{it.title}</h3>
              <p className="text-[var(--color-muted)]">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function About({ bundle, props }: BlockComponentProps<"about">) {
  if (props.variant === "micks-home") {
    const design = getDesign(bundle.theme ?? {});
    return (
      <section className="micks-about section">
        <div className="container-site micks-about-grid">
          {props.imageUrl && (
            <div className="micks-about-photo-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={props.imageUrl} alt={`Mick Eggers at ${bundle.settings?.businessName ?? bundle.site.name}`} className="micks-about-photo" />
            </div>
          )}
          <div className="micks-about-copy">
            <div className="micks-about-heading">
              <QuoteMark design={design} className="micks-about-quote" />
              {props.eyebrow && <p className="micks-section-kicker">{props.eyebrow}</p>}
            </div>
            <h2>{props.heading}</h2>
            <RichText text={props.body} className="prose-site" />
            <div className="micks-about-actions">
              {props.cta && <Link href={localSiteHref(bundle.site.slug, globalCtaHref(design, props.cta.href, props.cta.label))} className="btn btn-primary">{props.cta.label}</Link>}
              <CertificationBadges design={design} className="micks-about-action-certifications" />
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="section">
      <div className={`container-site grid items-center gap-12 ${props.imageUrl ? "md:grid-cols-2" : ""}`}>
        <div className={props.imageUrl ? "" : "mx-auto max-w-3xl"}>
          <p className="eyebrow mb-3">About us</p>
          <h2 className="mb-6 text-3xl font-bold uppercase md:text-4xl">{props.heading}</h2>
          <RichText text={props.body} className="prose-site text-lg text-[var(--color-muted)]" />
          {props.highlights.length > 0 && (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {props.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 font-semibold"><CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />{h}</li>
              ))}
            </ul>
          )}
        </div>
        {props.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={props.imageUrl} alt="" className="aspect-[4/3] w-full rounded-site object-cover shadow-lg" />
        )}
      </div>
    </section>
  );
}

export function Cta({ bundle, props }: BlockComponentProps<"cta">) {
  const design = getDesign(bundle.theme ?? {});
  const styles = {
    primary: "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
    dark: "bg-[var(--color-secondary)] text-white",
    light: "bg-[var(--color-surface)] text-[var(--color-text)]",
  }[props.variant];
  const btn = props.variant === "primary" ? "btn bg-white text-[var(--color-primary)]" : "btn btn-primary";
  return (
    <section className={`py-14 ${styles}`}>
      <div className="container-site flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold uppercase md:text-3xl">{props.heading}</h2>
          {props.body && <p className="mt-2 max-w-2xl opacity-90">{props.body}</p>}
        </div>
        <Link href={localSiteHref(bundle.site.slug, globalCtaHref(design, props.cta.href, props.cta.label))} className={btn}>{props.cta.label}</Link>
      </div>
    </section>
  );
}

export function RichTextBlock({ props }: BlockComponentProps<"rich_text">) {
  return (
    <section className="section">
      <div className="container-site max-w-3xl">
        {props.heading && <h1 className="mb-6 text-3xl font-bold uppercase md:text-4xl">{props.heading}</h1>}
        <RichText text={props.body} />
      </div>
    </section>
  );
}

export function Embed({ bundle, props, id }: BlockComponentProps<"embed">) {
  const cfg = props.integration === "tire_finder" || props.integration === "ai_diagnostic"
    ? sharedToolConfig(bundle)
    : props.integration !== "custom" ? bundle.integrations[props.integration] : undefined;
  const url = props.url || cfg?.url;
  const anchor = props.integration === "tire_finder" ? "tire-finder" : props.integration === "ai_diagnostic" ? "ai-diagnostic" : `embed-${id}`;
  if (props.variant === "micks-ai") {
    return (
      <section id={anchor} className="micks-ai-section">
        <div className="container-site micks-ai-grid">
          <div className="micks-ai-copy">
            <h2>{props.heading}{props.body && <span>{props.body}</span>}</h2>
            <div className="micks-tool-card">
              {props.cta ? <Link href={localSiteHref(bundle.site.slug, globalCtaHref(getDesign(bundle.theme ?? {}), props.cta.href, props.cta.label))}>AI DIAGNOSTIC TOOL</Link> : <strong>AI DIAGNOSTIC TOOL</strong>}
            </div>
            <p className="micks-tool-description">Try our AI diagnostic tool for an instant initial check before coming in.<br />Free, efficient, and time-saving.</p>
            {(props.offerHeading || props.offerBody) && <div className="micks-ai-offer"><strong>{props.offerHeading}</strong>{props.offerBody && <span>{props.offerBody}</span>}</div>}
          </div>
          {props.imageUrl && <div className="micks-feature-image">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={props.imageUrl} alt={`${bundle.settings?.businessName ?? bundle.site.name} diagnostic specialist`} /></div>}
        </div>
      </section>
    );
  }
  if (props.variant === "micks-tires") {
    return (
      <section id={anchor} className="micks-tires-section">
        <div className="container-site micks-tires-grid">
          {props.imageUrl && <div className="micks-tire-image">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={props.imageUrl} alt={`Wheel alignment at ${bundle.settings?.businessName ?? bundle.site.name}`} /></div>}
          <div className="micks-tire-copy">
            <h2>{props.heading}</h2>
            {props.cta && <Link href={localSiteHref(bundle.site.slug, globalCtaHref(getDesign(bundle.theme ?? {}), props.cta.href, props.cta.label))} className="btn btn-primary">{props.cta.label}</Link>}
            {props.body && <RichText text={props.body} className="prose-site" />}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id={anchor} className="section bg-[var(--color-surface)]">
      <div className="container-site">
        {props.heading && <h2 className="mb-3 text-center text-3xl font-bold uppercase">{props.heading}</h2>}
        {props.body && <p className="mx-auto mb-8 max-w-2xl text-center text-lg text-[var(--color-muted)]">{props.body}</p>}
        {url ? (
          <iframe src={url} title={props.heading ?? cfg?.label ?? "Embedded tool"} className="w-full rounded-site border-0 bg-white shadow" style={{ height: props.height }} loading="lazy" />
        ) : (
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-site border-2 border-dashed border-gray-300 bg-white p-10 text-center">
            <WrenchIcon className="h-8 w-8 text-[var(--color-primary)]" />
            <p className="text-[var(--color-muted)]">{cfg?.label ?? "This tool"} is coming soon. Call us and we&apos;ll help right away.</p>
            <Link href={localSiteHref(bundle.site.slug, globalCtaHref(getDesign(bundle.theme ?? {}), "/make-an-appointment/", "Schedule service"))} className="btn btn-primary">Schedule service</Link>
          </div>
        )}
      </div>
    </section>
  );
}
