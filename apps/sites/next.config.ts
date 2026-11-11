import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  // Match the old WordPress URLs (/about-us/, /engine-repair/ ...)
  trailingSlash: true,
  transpilePackages: ["@platform/db"],
  serverExternalPackages: ["mysql2"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  poweredByHeader: false,
};

export default config;
