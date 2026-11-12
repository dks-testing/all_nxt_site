import { buildSlots } from "@platform/db/booking";
import { BookingFormClient } from "../BookingFormClient";
import type { BlockComponentProps } from "./types";
import { telHref, formatAddress, groupHours } from "@/lib/format";
import Link from "next/link";
import { localSiteHref } from "@/lib/url";
import { getDesign } from "@platform/db/theme";
import { globalCtaHref } from "@/lib/global-content";

export function BookingForm({ bundle, props }: BlockComponentProps<"booking_form">) {
  const b = bundle.booking;
  if (b && !b.enabled) return null;
  const rules = { slotMinutes: b?.slotMinutes ?? 30, openTime: b?.openTime ?? "08:00", closeTime: b?.closeTime ?? "16:30", closedDays: b?.closedDays ?? [0, 6] };
  return (
    <section className="section" id="book">
      <div className="container-site max-w-4xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold uppercase md:text-4xl">{props.heading}</h2>
          {props.subheading && <p className="mt-3 text-lg text-[var(--color-muted)]">{props.subheading}</p>}
        </div>
        <BookingFormClient siteSlug={bundle.site.slug} slots={buildSlots(rules)} closedDays={rules.closedDays} disabledDates={b?.disabledDates ?? []} leadDays={b?.leadDays ?? 0} confirmation={b?.confirmationMessage ?? "Thanks! We'll be in touch shortly to confirm."} fields={b?.formFields ?? []} appearance={b?.appearance} />
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
  const rules = { slotMinutes: booking?.slotMinutes ?? 30, openTime: booking?.openTime ?? "08:00", closeTime: booking?.closeTime ?? "16:30", closedDays: booking?.closedDays ?? [0, 6] };
  return <section className="micks-contact-booking section" id="contact">
    <div className="container-site micks-contact-booking-grid">
      <div className="micks-contact-column">
        <h2>Contact Us</h2>
        {address && <iframe title={`Map to ${settings?.businessName ?? "us"}`} src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />}
        <h3>{contactProps.heading}</h3>
        <ul>
          {address && <li><strong>Address:</strong> {address}</li>}
          {settings?.phone && <li><strong>Phone:</strong> <a href={telHref(settings.phone)}>{settings.phone}</a></li>}
          {settings?.hours && <li className="micks-contact-hours"><strong>Hours:</strong> <span>{groupHours(settings.hours).map((row) => <span key={row.days}>{row.days}: {row.time}</span>)}</span></li>}
        </ul>
        <div className="micks-contact-actions">
          {settings?.phone && <a href={telHref(settings.phone)}><span>Call Now</span></a>}
          {address && <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}><span>Get Directions</span></a>}
          <Link href={localSiteHref(bundle.site.slug, globalCtaHref(getDesign(bundle.theme ?? {}), "/make-an-appointment/", "Schedule Service"))}><span>Schedule Service</span></Link>
        </div>
      </div>
      <div className="micks-booking-column" id="book">
        <h2>{booking?.appearance?.landingHeading || bookingProps.heading}</h2>
        <BookingFormClient siteSlug={bundle.site.slug} slots={buildSlots(rules)} closedDays={rules.closedDays} disabledDates={booking?.disabledDates ?? []} leadDays={booking?.leadDays ?? 0} confirmation={booking?.confirmationMessage ?? "Thanks! We'll be in touch shortly to confirm."} fields={booking?.formFields ?? []} variant="landing" appearance={booking?.appearance} />
      </div>
    </div>
  </section>;
}
