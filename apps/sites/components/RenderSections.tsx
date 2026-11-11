import { isBlockType, parseBlock, type BlockType } from "@platform/db/blocks";
import type { SiteBundle } from "@platform/db";
import type { SiteCtx } from "@/lib/data";
import { Hero } from "./blocks/Hero";
import { TrustCards, About, Cta, RichTextBlock, Embed } from "./blocks/Simple";
import { ServicesGrid, Specials, Reviews, CaseStudies, Faq, ContactMap } from "./blocks/Collections";
import { BookingForm, MicksContactBooking } from "./blocks/Booking";
import { getDesign } from "@platform/db/theme";
import { globalizeContent } from "@/lib/global-content";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registry: Record<BlockType, (p: any) => React.ReactNode | Promise<React.ReactNode>> = {
  hero: Hero,
  trust_cards: TrustCards,
  about: About,
  services_grid: ServicesGrid,
  specials: Specials,
  reviews: Reviews,
  case_studies: CaseStudies,
  faq: Faq,
  contact_map: ContactMap,
  booking_form: BookingForm,
  cta: Cta,
  rich_text: RichTextBlock,
  embed: Embed,
};

type Section = { id: string; type: string; props: Record<string, unknown> };

export function RenderSections({ sections, ctx, bundle, pageSlug }: { sections: Section[]; ctx: SiteCtx; bundle: SiteBundle; pageSlug: string }) {
  const design = getDesign(bundle.theme ?? {});
  const compositeHome = pageSlug === "" && (design.heroStyle === "micks-overlay" || (!design.heroStyle && design.headerStyle === "angled"));
  const firstHeroIndex = compositeHome ? sections.findIndex((x) => x.type === "hero") : -1;
  const trustIndex = firstHeroIndex >= 0 ? sections.findIndex((x, i) => i > firstHeroIndex && x.type === "trust_cards") : -1;
  const integratedTrust = trustIndex >= 0 ? parseBlock("trust_cards", globalizeContent(sections[trustIndex].props, bundle)) : undefined;
  const contactIndex = compositeHome ? sections.findIndex((x) => x.type === "contact_map") : -1;
  const bookingIndex = contactIndex >= 0 ? sections.findIndex((x, i) => i > contactIndex && x.type === "booking_form") : -1;
  const contactProps = contactIndex >= 0 ? parseBlock("contact_map", globalizeContent(sections[contactIndex].props, bundle)) : null;
  const bookingProps = bookingIndex >= 0 ? parseBlock("booking_form", globalizeContent(sections[bookingIndex].props, bundle)) : null;
  return (
    <>
      {sections.map((s, index) => {
        if (index === trustIndex && integratedTrust) return null;
        if (index === bookingIndex && contactProps && bookingProps) return null;
        if (index === contactIndex && contactProps && bookingProps) return <MicksContactBooking key={s.id} bundle={bundle} contactProps={contactProps} bookingProps={bookingProps} />;
        if (!isBlockType(s.type)) return null;
        const props = parseBlock(s.type, globalizeContent(s.props, bundle));
        if (!props) {
          if (ctx.preview) return <div key={s.id} className="container-site my-4 rounded bg-amber-50 p-4 text-sm text-amber-900">Section “{s.type}” has invalid settings and is hidden on the live site.</div>;
          return null;
        }
        const C = registry[s.type];
        return <C key={s.id} id={s.id} index={index} pageSlug={pageSlug} ctx={ctx} bundle={bundle} props={props} {...(index === firstHeroIndex && integratedTrust ? { integratedTrust } : {})} />;
      })}
    </>
  );
}
