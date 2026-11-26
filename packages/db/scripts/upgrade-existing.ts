/** Idempotent additive schema upgrade. Run only after a MySQL backup. */
import mysql from "mysql2/promise";
import { mysqlConnectionUrl, mysqlSslEnabled } from "../src/connection";

const tables: Record<string, Record<string, string>> = {
  site_settings: { owner_name: "VARCHAR(191) NULL" },
  themes: { design: "JSON NULL" },
  pages: { canonical_url: "VARCHAR(1024) NULL", no_index: "BOOLEAN NOT NULL DEFAULT FALSE", no_follow: "BOOLEAN NOT NULL DEFAULT FALSE", seo_keywords: "TEXT NULL" },
  services: {
    seo_keywords: "TEXT NULL",
    process_heading: "VARCHAR(255) NULL",
    process_steps: "JSON NULL",
    vehicle_callout_heading: "VARCHAR(255) NULL",
    vehicle_callout_body: "TEXT NULL",
    vehicle_callout_bullets: "JSON NULL",
    show_vehicle_callout: "BOOLEAN NOT NULL DEFAULT FALSE",
    trust_heading: "VARCHAR(255) NULL",
    trust_items: "JSON NULL",
    final_heading: "VARCHAR(255) NULL",
    final_body: "TEXT NULL",
    final_cta_label: "VARCHAR(64) NULL",
    final_cta_href: "VARCHAR(1024) NULL",
  },
  specials: {
    tagline: "TEXT NULL",
    included_heading: "VARCHAR(255) NULL",
    cta_label: "VARCHAR(64) NULL",
    cta_href: "VARCHAR(1024) NULL",
    coupon_button_label: "VARCHAR(64) NULL",
    coupon_button_href: "VARCHAR(1024) NULL",
  },
  booking_settings: {
    form_fields: "JSON NULL",
    disabled_dates: "JSON NULL",
    appearance: "JSON NULL",
    vehicle_api: "JSON NULL",
    admin_email_subject: "VARCHAR(255) NULL",
    admin_email_template: "TEXT NULL",
    customer_email_subject: "VARCHAR(255) NULL",
    customer_email_template: "TEXT NULL",
    sms_template: "TEXT NULL",
  },
  appointments: { extra_fields: "JSON NULL" },
};
async function main() {
  const conn = await mysql.createConnection({ uri: mysqlConnectionUrl(), ...(mysqlSslEnabled() ? { ssl: {} } : {}) });
  try {
    const [[db]] = await conn.query<mysql.RowDataPacket[]>("SELECT DATABASE() AS name");
    const name = db.name as string;
    console.log(`Upgrading schema in ${name}. Do not run against the legacy next_admin_db unless you migrated the schema.`);
    await conn.query(`CREATE TABLE IF NOT EXISTS \`team_profiles\` (
      \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
      \`site_id\` VARCHAR(36) NOT NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`position\` VARCHAR(191) NULL,
      \`description\` TEXT NULL,
      \`image_url\` VARCHAR(1024) NULL,
      \`sort_order\` INT NOT NULL DEFAULT 0,
      \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
      INDEX \`team_profiles_site_idx\` (\`site_id\`, \`sort_order\`)
    )`);
    console.log("READY team_profiles");
    for (const [table, columns] of Object.entries(tables)) {
      const [exists] = await conn.execute<mysql.RowDataPacket[]>("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?", [name, table]);
      if (!exists.length) throw new Error(`Required Shop Platform table ${table} is missing; initialize the correct platform database first.`);
      for (const [column, definition] of Object.entries(columns)) {
        const [rows] = await conn.execute<mysql.RowDataPacket[]>("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?", [name, table, column]);
        if (rows.length) { console.log(`SKIP ${table}.${column}`); continue; }
        // Table and column identifiers are from the fixed allowlist above, never user input.
        await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        console.log(`ADDED ${table}.${column}`);
      }
    }
    // Convert legacy crew arrays into reusable profiles once, preserving page order and images.
    const [aboutSections] = await conn.query<mysql.RowDataPacket[]>("SELECT id, site_id, props FROM page_sections WHERE type='about'");
    for (const section of aboutSections) {
      const props = typeof section.props === "string" ? JSON.parse(section.props) : section.props;
      if (!Array.isArray(props?.crew) || props.crew.length === 0 || (Array.isArray(props.teamMemberIds) && props.teamMemberIds.length > 0)) continue;
      const [existing] = await conn.execute<mysql.RowDataPacket[]>("SELECT id FROM team_profiles WHERE site_id=? LIMIT 1", [section.site_id]);
      if (existing.length) continue;
      const ids: string[] = [];
      for (let index = 0; index < props.crew.length; index++) {
        const member = props.crew[index];
        if (!member?.title) continue;
        const memberId = crypto.randomUUID();
        ids.push(memberId);
        await conn.execute("INSERT INTO team_profiles (id, site_id, name, position, description, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)", [memberId, section.site_id, member.title, null, member.body || null, props.crewImageUrls?.[index] || null, index]);
      }
      props.teamMemberIds = ids;
      await conn.execute("UPDATE page_sections SET props=? WHERE id=?", [JSON.stringify(props), section.id]);
      console.log(`MIGRATED ${ids.length} team profiles for site ${section.site_id}`);
    }
    console.log("Schema upgrade complete. No existing rows were deleted.");
  } finally { await conn.end(); }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
