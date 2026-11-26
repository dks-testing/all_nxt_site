import type { SiteBundle } from "@platform/db";
import { getContactPhotoHeading, type BlockProps } from "@platform/db/blocks";
import { getDesign } from "@platform/db/theme";
import { formatAddress, groupHours, telHref } from "@/lib/format";
import { globalText } from "@/lib/global-content";
import { PhoneIcon } from "./Icons";

export function MicksContactDetails({ bundle, props }: { bundle: SiteBundle; props?: BlockProps<"contact_map"> }) {
  const settings = bundle.settings;
  const design = getDesign(bundle.theme ?? {});
  const address = formatAddress(settings?.address);
  const businessName = settings?.businessName || bundle.site.name;
  const image = props?.imageUrl || design.aboutOwnerImageUrl || "https://www.micksrepair.com/wp-content/uploads/2026/04/micks-repair-worthington-mn-mick-eggers.jpeg";
  const heading = globalText(getContactPhotoHeading(props), bundle);
  return <section className="micks-contact-details" id="contact">
    <div className="container-site micks-contact-details-grid">
      <article className="micks-contact-profile">
        <h2>{heading}</h2>
        <img src={image} alt={`Meet the team at ${businessName}`} />
        <h3>{businessName}</h3>
        <div className="micks-contact-profile-info">
          {address && <p>{address}</p>}
          {settings?.phone && <a href={telHref(settings.phone)}><PhoneIcon />{settings.phone}</a>}
          {settings?.hours && <ul>{groupHours(settings.hours).map((row) => <li key={row.days}>{row.days}: {row.time}</li>)}</ul>}
        </div>
      </article>
      {address && <iframe className="micks-contact-details-map" title={`Map to ${businessName}`} src={`https://www.google.com/maps?q=${encodeURIComponent(`${businessName}, ${address}`)}&z=15&output=embed`} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />}
    </div>
  </section>;
}
