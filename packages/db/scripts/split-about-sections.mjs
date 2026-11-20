/** Replace the legacy all-in-one About block with independently sortable sections. */
import mysql from "mysql2/promise";

function connectionUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  if (!process.env.DB_NAME) throw new Error("Provide DB_NAME or DATABASE_URL");
  return `mysql://${encodeURIComponent(process.env.DB_USER || "root")}:${encodeURIComponent(process.env.DB_PASSWORD || "")}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "3306"}/${encodeURIComponent(process.env.DB_NAME)}`;
}

function tokens(value) {
  if (typeof value === "string") return value
    .replace(/Mick(?:'|’)?s Repair\b/gi, "{{businessName}}")
    .replace(/\bMick(?:'|’)?s\b/gi, "{{ownerName}}");
  if (Array.isArray(value)) return value.map(tokens);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, tokens(item)]));
  return value;
}

const conn = await mysql.createConnection({ uri: connectionUrl(), ...(/^(true|1|yes)$/i.test(process.env.DB_SSL || "false") ? { ssl: {} } : {}) });
try {
  await conn.beginTransaction();
  const [rows] = await conn.execute(`SELECT ps.id, ps.page_id, ps.site_id, ps.props, ps.sort_order
    FROM page_sections ps INNER JOIN pages p ON p.id=ps.page_id INNER JOIN sites s ON s.id=p.site_id
    WHERE s.slug=? AND p.slug='about-us' AND ps.type='about' LIMIT 1 FOR UPDATE`, ["micks-repair"]);
  if (!rows.length) {
    const [existing] = await conn.execute(`SELECT COUNT(*) count FROM page_sections ps INNER JOIN pages p ON p.id=ps.page_id INNER JOIN sites s ON s.id=p.site_id
      WHERE s.slug=? AND p.slug='about-us' AND ps.type IN ('about_intro','about_mission','about_work','about_owner','team_gallery','about_cta')`, ["micks-repair"]);
    console.log(existing[0].count ? "About Us is already split into separate sections" : "Legacy About section not found");
    await conn.rollback();
    process.exit(0);
  }
  const row = rows[0];
  const legacy = typeof row.props === "string" ? JSON.parse(row.props) : row.props;
  const ownerParagraphs = String(legacy.ownerBody || "").replace(/\r/g, "").split(/\n{2,}/).filter(Boolean);
  const [ownerName = "", ...ownerIntro] = (ownerParagraphs.shift() || "").split("\n");
  const [profiles] = await conn.execute("SELECT id FROM team_profiles WHERE site_id=? AND is_active=TRUE ORDER BY sort_order", [row.site_id]);
  const teamMemberIds = Array.isArray(legacy.teamMemberIds) && legacy.teamMemberIds.length ? legacy.teamMemberIds : profiles.map((profile) => profile.id);
  const sections = [
    ["about_intro", { eyebrow: legacy.eyebrow || "About Us", heading: legacy.heading || "About us", body: legacy.body || "", imageUrl: legacy.imageUrl || "" }],
    ["about_mission", { heading: legacy.missionHeading || "One Shop, One Mission", body: legacy.missionBody || "", imageUrl: legacy.vehicleImageUrl || "", locationLabel: legacy.locationLabel || "Location", phoneLabel: legacy.phoneLabel || "Phone", hoursLabel: legacy.hoursLabel || "Hours" }],
    ["about_work", { heading: legacy.workHeading || "How We Work", imageUrl: legacy.teamImageUrl || "", items: legacy.workItems || [] }],
    ["about_owner", { heading: legacy.ownerHeading || "Meet the Owner", ownerName, body: [ownerIntro.join("\n"), ...ownerParagraphs].filter(Boolean).join("\n\n"), imageUrl: legacy.imageUrl || "" }],
    ["team_gallery", { heading: "Meet the Team", teamMemberIds }],
    ["about_cta", { heading: legacy.finalHeading || "Know Before You Go.", body: legacy.finalBody || "", cta: legacy.finalCta || { label: "Start Diagnostics", href: "/diagnostics/" } }],
  ].map(([type, props]) => [type, tokens(props)]);

  await conn.execute("UPDATE page_sections SET sort_order=sort_order+? WHERE page_id=? AND sort_order>?", [sections.length - 1, row.page_id, row.sort_order]);
  for (let index = 0; index < sections.length; index++) {
    const [type, props] = sections[index];
    await conn.execute("INSERT INTO page_sections (id,page_id,site_id,type,props,sort_order,is_visible) VALUES (?,?,?,?,?,?,TRUE)", [crypto.randomUUID(), row.page_id, row.site_id, type, JSON.stringify(props), row.sort_order + index]);
  }
  await conn.execute("DELETE FROM page_sections WHERE id=?", [row.id]);
  await conn.execute("UPDATE team_profiles SET description=REPLACE(REPLACE(REPLACE(REPLACE(description, 'Mick’s Repair', '{{businessName}}'), \"Mick's Repair\", '{{businessName}}'), 'Mick’s', '{{ownerName}}'), \"Mick's\", '{{ownerName}}') WHERE site_id=?", [row.site_id]);
  await conn.commit();
  console.log(`Split About Us into ${sections.length} sections and tokenized shared business names`);
} catch (error) {
  await conn.rollback();
  throw error;
} finally {
  await conn.end();
}
