/** Idempotent additive schema upgrade. Run only after a MySQL backup. */
import mysql from "mysql2/promise";
import { mysqlConnectionUrl, mysqlSslEnabled } from "../src/connection";

const tables: Record<string, Record<string, string>> = {
  themes: { design: "JSON NULL" },
  pages: { canonical_url: "VARCHAR(1024) NULL", no_index: "BOOLEAN NOT NULL DEFAULT FALSE", no_follow: "BOOLEAN NOT NULL DEFAULT FALSE", seo_keywords: "TEXT NULL" },
  services: { seo_keywords: "TEXT NULL" },
  booking_settings: {
    form_fields: "JSON NULL",
    disabled_dates: "JSON NULL",
    appearance: "JSON NULL",
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
    console.log("Schema upgrade complete. No existing rows were deleted.");
  } finally { await conn.end(); }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
