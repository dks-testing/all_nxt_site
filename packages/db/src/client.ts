import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import { mysqlConnectionUrl, mysqlSslEnabled } from "./connection";

export type DB = MySql2Database<typeof schema>;

const globalForDb = globalThis as unknown as { __platformDb?: DB; __platformPool?: mysql.Pool };

function createDb(): DB {
  const pool =
    globalForDb.__platformPool ??
    mysql.createPool({
      uri: mysqlConnectionUrl(),
      connectionLimit: Number(process.env.DB_POOL_SIZE ?? 10),
      timezone: "Z",
      ...(mysqlSslEnabled() ? { ssl: {} } : {}),
    });
  globalForDb.__platformPool = pool;
  return drizzle(pool, { schema, mode: "default" });
}

/** Lazily-created singleton so builds without a DB don't crash at import time. */
export function getDb(): DB {
  if (!globalForDb.__platformDb) globalForDb.__platformDb = createDb();
  return globalForDb.__platformDb;
}

export async function closeDb() {
  await globalForDb.__platformPool?.end();
  globalForDb.__platformPool = undefined;
  globalForDb.__platformDb = undefined;
}
