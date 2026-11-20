/** Replace tenant-specific Mick's wording in CMS sections with global name tokens. */
import mysql from "mysql2/promise";

function connectionUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  return `mysql://${encodeURIComponent(process.env.DB_USER || "root")}:${encodeURIComponent(process.env.DB_PASSWORD || "")}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "3306"}/${encodeURIComponent(process.env.DB_NAME)}`;
}
function tokens(value) {
  if (typeof value === "string") return value.replace(/Mick(?:'|’)?s Repair\b/gi, "{{businessName}}").replace(/\bMick(?:'|’)?s\b/gi, "{{ownerName}}");
  if (Array.isArray(value)) return value.map(tokens);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, tokens(item)]));
  return value;
}

const conn = await mysql.createConnection({ uri: connectionUrl(), ...(/^(true|1|yes)$/i.test(process.env.DB_SSL || "false") ? { ssl: {} } : {}) });
try {
  const [sites] = await conn.execute("SELECT id FROM sites WHERE slug=? LIMIT 1", ["micks-repair"]);
  if (!sites.length) throw new Error("micks-repair site not found");
  const siteId = sites[0].id;
  const [sections] = await conn.execute("SELECT id,props FROM page_sections WHERE site_id=?", [siteId]);
  let changed = 0;
  for (const section of sections) {
    const props = typeof section.props === "string" ? JSON.parse(section.props) : section.props;
    const next = tokens(props);
    if (JSON.stringify(next) !== JSON.stringify(props)) {
      await conn.execute("UPDATE page_sections SET props=? WHERE id=?", [JSON.stringify(next), section.id]);
      changed++;
    }
  }
  const [profiles] = await conn.execute("SELECT id,name,position,description FROM team_profiles WHERE site_id=?", [siteId]);
  for (const profile of profiles) {
    const next = tokens({ name: profile.name, position: profile.position, description: profile.description });
    if (JSON.stringify(next) !== JSON.stringify({ name: profile.name, position: profile.position, description: profile.description })) {
      await conn.execute("UPDATE team_profiles SET name=?,position=?,description=? WHERE id=?", [next.name, next.position, next.description, profile.id]);
    }
  }
  console.log(`Tokenized ${changed} CMS sections for global business/owner names`);
} finally {
  await conn.end();
}
