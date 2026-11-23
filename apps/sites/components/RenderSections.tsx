import { isBlockType, parseBlock, type BlockType } from "@platform/db/blocks";
import type { SiteBundle } from "@platform/db";
import type { SiteCtx } from "@/lib/data";
import { Hero } from "./blocks/Hero";
import { TrustCards, About, Cta, RichTextBlock, Embed } from "./blocks/Simple";
import { ServicesGrid, Specials, Reviews, CaseStudies, Faq, ContactMap } from "./blocks/Collections";
import { BookingForm, MicksContactBooking } from "./blocks/Booking";
import { getDesign } from "@platform/db/theme";
import { globalizeContent } from "@/lib/global-content";
import { SmartFeature } from "./blocks/SmartFeature";
import { MicksTestimonials } from "./MicksTestimonials";
import { MicksContactDetails } from "./MicksContactDetails";
import { MicksAbout, MicksAboutSections, MicksServices } from "./MicksContentPages";
import { MicksSpecials } from "./MicksSpecials";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registry: Partial<Record<BlockType, (p: any) => React.ReactNode | Promise<React.ReactNode>>> = {
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
  smart_feature: SmartFeature,
};

type Section = { id: string; type: string; props: Record<string, unknown> };

export function RenderSections({ sections, ctx, bundle, pageSlug }: { sections: Section[]; ctx: SiteCtx; bundle: SiteBundle; pageSlug: string }) {
  const design = getDesign(bundle.theme ?? {});
  const compositeHome = pageSlug === "" && (design.heroStyle === "micks-overlay" || (!design.heroStyle && design.headerStyle === "angled"));
  const firstHeroIndex = compositeHome ? sections.findIndex((x) => x.type === "hero") : -1;
  const foundTrustIndex = firstHeroIndex >= 0 ? sections.findIndex((x, i) => i > firstHeroIndex && x.type === "trust_cards") : -1;
  const trustIndex = foundTrustIndex === firstHeroIndex + 1 ? foundTrustIndex : -1;
  const integratedTrust = trustIndex >= 0 ? parseBlock("trust_cards", globalizeContent(sections[trustIndex].props, bundle)) : undefined;
  const contactIndex = compositeHome ? sections.findIndex((x) => x.type === "contact_map") : -1;
  const foundBookingIndex = contactIndex >= 0 ? sections.findIndex((x, i) => i > contactIndex && x.type === "booking_form") : -1;
  const bookingIndex = foundBookingIndex === contactIndex + 1 ? foundBookingIndex : -1;
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
        if (s.type === "about_intro" || s.type === "about_mission" || s.type === "about_work" || s.type === "about_owner" || s.type === "team_gallery" || s.type === "about_cta") {
          return <MicksAboutSections key={s.id} bundle={bundle} ctx={ctx} sections={[s]} />;
        }
        if (s.type === "about" && pageSlug === "about-us" && design.headerStyle === "angled") {
          const aboutProps = parseBlock("about", globalizeContent(s.props, bundle));
          return aboutProps ? <MicksAbout key={s.id} bundle={bundle} ctx={ctx} props={aboutProps} /> : null;
        }
        const C = registry[s.type];
        if (!C) return null;
        if (s.type === "services_grid" && pageSlug === "services" && design.headerStyle === "angled") {
          const servicesProps = parseBlock("services_grid", globalizeContent(s.props, bundle));
          return servicesProps ? <MicksServices key={s.id} bundle={bundle} ctx={ctx} props={servicesProps} /> : null;
        }
        if (s.type === "specials" && pageSlug === "specials" && design.headerStyle === "angled") {
          const specialsProps = parseBlock("specials", globalizeContent(s.props, bundle));
          return specialsProps ? <MicksSpecials key={s.id} bundle={bundle} ctx={ctx} props={specialsProps} /> : null;
        }
        if (s.type === "contact_map" && pageSlug === "make-an-appointment" && design.headerStyle === "angled") {
          const contactProps = parseBlock("contact_map", globalizeContent(s.props, bundle));
          return contactProps ? <MicksContactDetails key={s.id} bundle={bundle} props={contactProps} /> : null;
        }
        if (s.type === "reviews" && pageSlug === "testimonials" && design.headerStyle === "angled") {
          const reviewProps = parseBlock("reviews", globalizeContent(s.props, bundle));
          return reviewProps ? <MicksTestimonials key={s.id} ctx={ctx} bundle={bundle} props={reviewProps} /> : null;
        }
        return <C key={s.id} id={s.id} index={index} pageSlug={pageSlug} ctx={ctx} bundle={bundle} props={props} {...(index === firstHeroIndex && integratedTrust ? { integratedTrust } : {})} />;
      })}
    </>
  );
}
