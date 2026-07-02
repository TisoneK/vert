import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Type errors should fail the build — don't let them ship silently
    // and surface as runtime bugs instead.
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
};

export default nextConfig;
