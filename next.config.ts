import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Type errors should fail the build — don't let them ship silently
    // and surface as runtime bugs instead.
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Strict-Transport-Security: force HTTPS for 2 years, including subdomains.
          // Vercel already sets this, but we set it explicitly so the policy
          // is documented in the repo (and survives any reverse-proxy change).
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // X-Content-Type-Options: stop browsers from MIME-sniffing responses
          // away from the declared Content-Type (e.g. serving text/plain as HTML).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // X-Frame-Options: prevent clickjacking by framing the site.
          // DENY is appropriate — Vert has no legit embedder.
          { key: "X-Frame-Options", value: "DENY" },
          // Referrer-Policy: only send the origin (not the full URL) to other sites.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions-Policy: disable camera/microphone/geolocation APIs the
          // app doesn't use, so a compromised script can't silently turn them on.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
