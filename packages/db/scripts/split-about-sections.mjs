/** Replace a site's combined About Us block with independently editable sections. */
import mysql from "mysql2/promise";
import { parseBlock } from "../src/blocks.ts";
import { mysqlConnectionUrl, mysqlSslEnabled } from "../src/connection.ts";
import { richTextHtmlPrefix } from "../src/rich-text.ts";

const [siteSlug, mode] = process.argv.slice(2);
if (!siteSlug || (mode && mode !== "--dry-run") || process.argv.length > 4) {
  throw new Error("Usage: db:split-about <site-slug> [--dry-run]");
}

const json = (value) => typeof value === "string" ? JSON.parse(value) : value;
const splitTypes = ["about_intro", "about_mission", "about_work", "about_owner", "team_gallery", "about_cta"];

function splitOwnerBody(ownerBody = "") {
  if (ownerBody.startsWith(richTextHtmlPrefix)) return { body: ownerBody };
  const paragraphs = ownerBody.split(/\n{2,}/).filter(Boolean);
  const [ownerName, ...intro] = (paragraphs.shift() ?? "").split("\n");
  return { ownerName, body: [intro.join("\n"), ...paragraphs].filter(Boolean).join("\n\n") };
}

const conn = await mysql.createConnection({ uri: mysqlConnectionUrl(), ...(mysqlSslEnabled() ? { ssl: {} } : {}) });
try {
  await conn.beginTransaction();
  const [[page]] = await conn.execute(`SELECT p.id, p.site_id FROM pages p
    INNER JOIN sites s ON s.id=p.site_id WHERE s.slug=? AND p.slug='about-us' FOR UPDATE`, [siteSlug]);
  if (!page) throw new Error(`About Us page not found for ${siteSlug}`);

  const [current] = await conn.execute(`SELECT id, type, props, sort_order, is_visible FROM page_sections
    WHERE page_id=? AND site_id=? ORDER BY sort_order, id FOR UPDATE`, [page.id, page.site_id]);
  const legacyIndex = current.findIndex(({ type }) => type === "about");
  const hasSplit = current.some(({ type }) => splitTypes.includes(type));
  if (legacyIndex === -1) {
    if (!hasSplit) throw new Error("The page has no About section to split");
    console.log(`About Us is already split for ${siteSlug}`);
  } else {
    if (hasSplit || current.some(({ type }, index) => type === "about" && index !== legacyIndex)) {
      throw new Error("The page contains overlapping About sections. Resolve the overlap before converting.");
    }
    const row = current[legacyIndex];
    const legacy = parseBlock("about", json(row.props));
    if (!legacy) throw new Error("The combined About block has invalid properties");

    const [[theme]] = await conn.execute("SELECT design FROM themes WHERE site_id=?", [page.site_id]);
    const design = json(theme?.design) ?? {};
    if (design.headerStyle !== "angled") throw new Error("This conversion applies to About Us pages using the angled template");
    if (row.is_visible && legacy.crew.length) {
      const [[activeProfile]] = await conn.execute("SELECT id FROM team_profiles WHERE site_id=? AND is_active=TRUE LIMIT 1", [page.site_id]);
      if (!activeProfile) throw new Error("This page still displays embedded crew cards. Move them to Our Team before converting.");
    }
    const ownerImage = legacy.imageUrl ?? design.aboutOwnerImageUrl;
    const parts = [
      { eyebrow: legacy.eyebrow, heading: legacy.heading, body: legacy.body, imageUrl: ownerImage },
      {
        heading: legacy.missionHeading || "Our mission",
        body: legacy.missionBody,
        imageUrl: legacy.vehicleImageUrl ?? design.aboutVehicleImageUrl,
        animateVehicleImage: legacy.animateVehicleImage,
        locationLabel: legacy.locationLabel,
        phoneLabel: legacy.phoneLabel,
        hoursLabel: legacy.hoursLabel,
        callCtaLabel: legacy.callCtaLabel,
      },
      { heading: legacy.workHeading || "How we work", imageUrl: legacy.teamImageUrl ?? design.aboutTeamImageUrl, items: legacy.workItems ?? design.aboutWorkItems },
      { heading: legacy.ownerHeading || "Meet the owner", ...splitOwnerBody(legacy.ownerBody), imageUrl: ownerImage },
      { teamMemberIds: legacy.teamMemberIds },
      { heading: legacy.finalHeading || "Learn more", body: legacy.finalBody, cta: legacy.finalCta ?? { label: "Learn More", href: "#" } },
    ];
    const sections = splitTypes.map((type, index) => {
      const props = parseBlock(type, parts[index]);
      if (!props) throw new Error(`Invalid settings for ${type}`);
      return { id: crypto.randomUUID(), type, props };
    });

    if (mode !== "--dry-run") {
      for (const [index, section] of current.slice(legacyIndex + 1).entries()) {
        await conn.execute("UPDATE page_sections SET sort_order=? WHERE id=?", [row.sort_order + sections.length + index, section.id]);
      }
      for (const [index, section] of sections.entries()) {
        await conn.execute(`INSERT INTO page_sections (id,page_id,site_id,type,props,sort_order,is_visible)
          VALUES (?,?,?,?,?,?,?)`, [section.id, page.id, page.site_id, section.type, JSON.stringify(section.props), row.sort_order + index, row.is_visible]);
      }
      await conn.execute("DELETE FROM page_sections WHERE id=?", [row.id]);
      await conn.commit();
    }
    console.log(`${mode === "--dry-run" ? "Would split" : "Split"} About Us for ${siteSlug} into ${sections.map(({ type }) => type).join(", ")}`);
  }
} finally {
  await conn.rollback();
  await conn.end();
}
