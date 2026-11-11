import "dotenv/config";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { mysqlConnectionUrl } from "./src/connection";

config({ path: "../../.env" });

export default defineConfig({
  dialect: "mysql",
  schema: "./src/schema.ts",
  out: "./migrations",
  dbCredentials: { url: mysqlConnectionUrl() },
});
