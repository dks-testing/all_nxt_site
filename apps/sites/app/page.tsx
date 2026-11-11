import { redirect } from "next/navigation";

/** Root URL displays the locally selected default tenant via its slug URL. */
export default function LocalIndex() {
  const configured = process.env.LOCAL_DEFAULT_SITE_SLUG?.trim() || "micks-repair";
  const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(configured) ? configured : "micks-repair";
  redirect(`/${slug}/`);
}
