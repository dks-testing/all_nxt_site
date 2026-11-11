import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  // Admin app
  trailingSlash: false,
  transpilePackages: ["@platform/db"],
  serverExternalPackages: ["mysql2"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "14mb" } },
};

export default config;
