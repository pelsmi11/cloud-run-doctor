import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@google/adk", "@mikro-orm/sqlite", "@mikro-orm/better-sqlite", "@mikro-orm/core"],
  webpack: (config) => {
    config.externals = config.externals || [];
    // Don't bundle optional ADK peers
    return config;
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
