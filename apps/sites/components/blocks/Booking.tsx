import { buildSlots } from "@platform/db/booking";
import { BookingFormClient } from "../BookingFormClient";
import type { BlockComponentProps } from "./types";
import { telHref, formatAddress, groupHours, RichText } from "@/lib/format";
import Link from "next/link";
import { localSiteHref } from "@/lib/url";
import { getDesign } from "@platform/db/theme";
import { globalCta } from "@/lib/global-content";

function bookingFormSettings(bundle: BlockComponentProps<"booking_form">["bundle"]) {
  const booking = bundle.booking;
  const closedDays = booking?.closedDays ?? [0, 6];
  return {
    siteSlug: bundle.site.slug,
    slots: buildSlots({
      slotMinutes: booking?.slotMinutes ?? 30,
      openTime: booking?.openTime ?? "08:00",
      closeTime: booking?.closeTime ?? "16:30",
      closedDays,
    }),
    closedDays,
    disabledDates: booking?.disabledDates ?? [],
    leadDays: booking?.leadDays ?? 0,
    confirmation: booking?.confirmationMessage ?? "Thanks! We'll be in touch shortly to confirm.",
    fields: booking?.formFields ?? [],
    appearance: booking?.appearance,
  };
}

const contactBookingPages = new Set(["contact", "contact-us", "make-an-appointment"]);

export function BookingForm({ bundle, props, pageSlug }: Pick<BlockComponentProps<"booking_form">, "bundle" | "props" | "pageSlug">) {
  if (bundle.booking?.enabled === false) return null;
  const settings = bookingFormSettings(bundle);
  if (contactBookingPages.has(pageSlug)) {
    return (
      <section className="micks-appointment-page micks-contact-page section" id="book">
        <div className="container-site">
          <BookingFormClient
            {...settings}
            variant="appointment"
            heading={settings.appearance?.appointmentHeading || props.heading}
            subheading={props.subheading}
            plateState={bundle.settings?.address?.region}
            initialSlotCount={4}
          />
        </div>
      </section>
    );
  }
  return (
    <section className="section !pb-0" id="book">
      <div className="container-site">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold uppercase md:text-4xl">{props.heading}</h2>
          {props.subheading && <RichText text={props.subheading} className="mt-3 text-lg text-[var(--color-muted)]" bundle={bundle} />}
        </div>
        <BookingFormClient {...settings} />
      </div>
    </section>
  );
}

export function MicksContactBooking({ bundle, contactProps, bookingProps }: {
  bundle: BlockComponentProps<"contact_map">["bundle"];
  contactProps: BlockComponentProps<"contact_map">["props"];
  bookingProps: BlockComponentProps<"booking_form">["props"];
}) {
  const settings = bundle.settings;
  const booking = bundle.booking;
  if (booking && !booking.enabled) return null;
  const address = formatAddress(settings?.address);
  const design = getDesign(bundle.theme ?? {});
  const callAction = globalCta(design, design.callCtaHref || telHref(settings?.phone), "Call Now");
  const scheduleAction = globalCta(design, "/make-an-appointment/", "Schedule Service");
  return <section className="micks-contact-booking section" id="contact">
    <div className="container-site micks-contact-booking-grid">
      <div className="micks-contact-column">
        <h2>Contact Us</h2>
        {address && <iframe title={`Map to ${settings?.businessName ?? "us"}`} src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`} width="600" height="360" loading="eager" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />}
        <h3>{contactProps.heading}</h3>
        <ul>
          {address && <li><strong>Address:</strong> {address}</li>}
          {settings?.phone && <li><strong>Phone:</strong> <a href={telHref(settings.phone)}>{settings.phone}</a></li>}
          {settings?.hours && <li className="micks-contact-hours"><strong>Hours:</strong> <span>{groupHours(settings.hours).map((row) => <span key={row.days}>{row.days}: {row.time}</span>)}</span></li>}
        </ul>
        {((settings?.phone && callAction) || address || scheduleAction) && <div className="micks-contact-actions">
          {settings?.phone && callAction && <a href={callAction.href}><span>{callAction.label}</span></a>}
          {address && <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}><span>Get Directions</span></a>}
          {scheduleAction && <Link href={localSiteHref(bundle.site.slug, scheduleAction.href)}><span>{scheduleAction.label}</span></Link>}
        </div>}
      </div>
      <div className="micks-booking-column" id="book">
        <h2>{booking?.appearance?.landingHeading || bookingProps.heading}</h2>
        <BookingFormClient {...bookingFormSettings(bundle)} variant="landing" />
      </div>
    </div>
  </section>;
}
