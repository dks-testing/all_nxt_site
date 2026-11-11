/** One source of truth for runtime MySQL and Drizzle Kit connections. */
export function mysqlConnectionUrl(): string {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "3306";
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD ?? "";
  const database = process.env.DB_NAME;
  if (!database) throw new Error("Provide DB_NAME or DATABASE_URL in .env");
  if (!/^\d{2,5}$/.test(port)) throw new Error("Invalid DB_PORT");
  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;
}
export function mysqlSslEnabled(): boolean {
  return /^(true|1|yes)$/i.test(process.env.DB_SSL ?? "false");
}
